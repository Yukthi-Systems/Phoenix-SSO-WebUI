/*
 * Copyright (C) 2026 Yukthi Systems Private Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { isValidOrigin } from '../utils/security';
import type { SilentAuthResult, SsoMessage } from '../types';

interface IframeManager {
  iframeElement: HTMLIFrameElement | null;
  messageListener: ((event: MessageEvent) => void) | null;
  timeoutTimer: ReturnType<typeof setTimeout> | null;
  checkSilentAuth(ssoUrl: string, appName: string, timeoutMs?: number): Promise<SilentAuthResult>;
  cleanup(): void;
}

/**
 * Reusable Iframe Authentication Manager for client apps to run silent session validations.
 */
export const iframeManager: IframeManager = {
  iframeElement: null,
  messageListener: null,
  timeoutTimer: null,

  /**
   * Performs silent auth check using a hidden iframe.
   *
   * @param ssoUrl - The centralized SSO base URL (e.g. "https://sso.example.com")
   * @param appName - The client application name (e.g. "app1")
   * @param timeoutMs - Max timeout in milliseconds (default: 5000)
   * @returns Resolves on session validity, rejects on invalid session or timeout
   */
  checkSilentAuth(ssoUrl, appName, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      // 1. Pre-cleanup
      this.cleanup();

      // 2. Build target silent auth URL
      const targetUrl = new URL(`${ssoUrl}/silent-auth`);
      targetUrl.searchParams.set('app', appName);
      targetUrl.searchParams.set('origin', window.location.origin);

      // 3. Create hidden iframe element
      this.iframeElement = document.createElement('iframe');
      this.iframeElement.style.display = 'none';
      this.iframeElement.style.width = '0px';
      this.iframeElement.style.height = '0px';
      this.iframeElement.src = targetUrl.toString();
      this.iframeElement.id = 'sso-silent-auth-frame';

      // 4. Setup message listener
      this.messageListener = (event: MessageEvent) => {
        // Security checks
        if (!isValidOrigin(event.origin) && event.origin !== ssoUrl) {
          return;
        }

        const data = event.data as SsoMessage | undefined;
        if (!data || typeof data !== 'object') return;

        // Process message results
        if (data.type === 'SSO_AUTH_SUCCESS') {
          resolve({ status: 'authenticated', data: data.payload ?? null });
          this.cleanup();
        } else if (data.type === 'SSO_AUTH_FAILED' || data.type === 'SSO_SESSION_EXPIRED') {
          reject(new Error(data.message || 'No active session found.'));
          this.cleanup();
        }
      };

      window.addEventListener('message', this.messageListener);

      // 5. Setup safety timeout
      this.timeoutTimer = setTimeout(() => {
        reject(new Error('Silent authentication request timed out.'));
        this.cleanup();
      }, timeoutMs);

      // 6. Append to document body to trigger loading
      document.body.appendChild(this.iframeElement);
    });
  },

  /**
   * Cleans up iframe element, event listeners, and timers.
   */
  cleanup() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    if (this.iframeElement) {
      if (this.iframeElement.parentNode) {
        this.iframeElement.parentNode.removeChild(this.iframeElement);
      }
      this.iframeElement = null;
    }
  }
};

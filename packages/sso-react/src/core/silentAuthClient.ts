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

import type { SsoMessage } from '../types';

let iframeElement: HTMLIFrameElement | null = null;
let messageListener: ((event: MessageEvent) => void) | null = null;
let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

function cleanup(): void {
  if (messageListener) {
    window.removeEventListener('message', messageListener);
    messageListener = null;
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer);
    timeoutTimer = null;
  }
  if (iframeElement) {
    iframeElement.parentNode?.removeChild(iframeElement);
    iframeElement = null;
  }
}

/**
 * Performs a silent auth check via a hidden iframe against the SSO service's
 * `/silent-auth` page — used to detect an existing session without a popup.
 * Resolves with the session payload on success, rejects on invalid session or timeout.
 */
export function checkSilentAuth(ssoUrl: string, appId: string, timeoutMs = 5000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    cleanup();

    const ssoOrigin = new URL(ssoUrl).origin;

    const targetUrl = new URL(`${ssoUrl}/silent-auth`);
    targetUrl.searchParams.set('app', appId);
    targetUrl.searchParams.set('origin', window.location.origin);

    iframeElement = document.createElement('iframe');
    iframeElement.style.display = 'none';
    iframeElement.style.width = '0px';
    iframeElement.style.height = '0px';
    iframeElement.src = targetUrl.toString();
    iframeElement.id = 'sso-silent-auth-frame';

    messageListener = (event: MessageEvent) => {
      if (event.origin !== ssoOrigin) return;

      const data = event.data as SsoMessage | undefined;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SSO_AUTH_SUCCESS') {
        resolve(data.payload ?? null);
        cleanup();
      } else if (data.type === 'SSO_AUTH_FAILED' || data.type === 'SSO_SESSION_EXPIRED') {
        reject(new Error(data.message || 'No active session found.'));
        cleanup();
      }
    };

    window.addEventListener('message', messageListener);

    timeoutTimer = setTimeout(() => {
      reject(new Error('Silent authentication request timed out.'));
      cleanup();
    }, timeoutMs);

    document.body.appendChild(iframeElement);
  });
}

/** Cancels any in-flight silent auth check and cleans up the iframe/listeners/timer. */
export function cancelSilentAuth(): void {
  cleanup();
}

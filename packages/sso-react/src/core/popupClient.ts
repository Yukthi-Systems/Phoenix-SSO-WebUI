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

// Module-level state mirrors a single in-flight login popup — matches the
// assumption already made by the hosted SSO app's own popup flow that only
// one login attempt is active per page at a time.
let activePopup: Window | null = null;
let messageListener: ((event: MessageEvent) => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function cleanup(): void {
  if (messageListener) {
    window.removeEventListener('message', messageListener);
    messageListener = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (activePopup) {
    if (!activePopup.closed) activePopup.close();
    activePopup = null;
  }
}

export interface OpenLoginPopupOptions {
  width?: number;
  height?: number;
}

/**
 * Thrown by openLoginPopup() specifically when the browser blocked the popup
 * (as opposed to the user closing it, or auth failing). Lets callers branch
 * on "should I fall back to a full-page redirect?" without string-matching
 * error messages.
 */
export class PopupBlockedError extends Error {
  constructor(message = 'Popup blocked by browser. Please enable popups for this site.') {
    super(message);
    this.name = 'PopupBlockedError';
  }
}

/**
 * Opens the SSO login popup and waits for the authentication result.
 * Resolves on success, rejects on failure, block, or the user closing the popup.
 */
export function openLoginPopup(ssoUrl: string, appId: string, options: OpenLoginPopupOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    cleanup();

    // The popup navigates to ssoUrl, so that's the only origin this window
    // should ever trust a postMessage from for this flow.
    const ssoOrigin = new URL(ssoUrl).origin;

    const width = options.width ?? 480;
    const height = options.height ?? 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const targetUrl = new URL(`${ssoUrl}/login`);
    targetUrl.searchParams.set('mode', 'popup');
    targetUrl.searchParams.set('app', appId);
    targetUrl.searchParams.set('origin', window.location.origin);

    activePopup = window.open(
      targetUrl.toString(),
      'SSOLoginPopup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    if (!activePopup) {
      reject(new PopupBlockedError());
      return;
    }

    messageListener = (event: MessageEvent) => {
      if (event.origin !== ssoOrigin) return;

      const data = event.data as SsoMessage | undefined;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'SSO_AUTH_SUCCESS') {
        resolve();
        cleanup();
      } else if (data.type === 'SSO_AUTH_FAILED') {
        reject(new Error(data.message || 'SSO authentication failed.'));
        cleanup();
      }
    };

    window.addEventListener('message', messageListener);

    pollTimer = setInterval(() => {
      if (!activePopup || activePopup.closed) {
        reject(new Error('Login popup was closed before completing authentication.'));
        cleanup();
      }
    }, 500);
  });
}

/** Cancels any in-flight login popup and cleans up listeners/timers. */
export function cancelLoginPopup(): void {
  cleanup();
}

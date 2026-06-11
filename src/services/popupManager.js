import { isValidOrigin } from '../utils/security';

/**
 * Reusable Popup Authentication Manager for client apps to integrate with the SSO platform.
 */
export const popupManager = {
  activePopup: null,
  messageListener: null,
  pollTimer: null,

  /**
   * Opens the SSO popup and waits for authentication result.
   * 
   * @param {string} ssoUrl - The centralized SSO base URL (e.g. "https://sso.example.com")
   * @param {string} appName - The client application name (e.g. "app1")
   * @returns {Promise<object>} Resolves on auth success, rejects on failure or closure
   */
  openLoginPopup(ssoUrl, appName) {
    return new Promise((resolve, reject) => {
      // 1. Clean up any existing popup/listeners first
      this.cleanup();

      // 2. Calculate coordinates for center window
      const width = 480;
      const height = 620;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      // 3. Build target SSO Login URL
      const targetUrl = new URL(`${ssoUrl}/login`);
      targetUrl.searchParams.set('mode', 'popup');
      targetUrl.searchParams.set('app', appName);
      targetUrl.searchParams.set('origin', window.location.origin);

      // 4. Open the popup window
      this.activePopup = window.open(
        targetUrl.toString(),
        'SSOLoginPopup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!this.activePopup) {
        reject(new Error('Popup blocked by browser. Please enable popups for this site.'));
        return;
      }

      // 5. Setup postMessage event listener
      this.messageListener = (event) => {
        // Validate origin
        if (!isValidOrigin(event.origin) && event.origin !== ssoUrl) {
          return;
        }

        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'SSO_AUTH_SUCCESS') {
          resolve({ status: 'success' });
          this.cleanup();
        } else if (data.type === 'SSO_AUTH_FAILED') {
          reject(new Error(data.message || 'SSO Authentication failed.'));
          this.cleanup();
        }
      };

      window.addEventListener('message', this.messageListener);

      // 6. Monitor popup window closure manually
      this.pollTimer = setInterval(() => {
        if (!this.activePopup || this.activePopup.closed) {
          reject(new Error('Login popup was closed by the user before completing auth.'));
          this.cleanup();
        }
      }, 500);
    });
  },

  /**
   * Cleans up all listeners, active timers, and handles.
   */
  cleanup() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.activePopup) {
      if (!this.activePopup.closed) {
        this.activePopup.close();
      }
      this.activePopup = null;
    }
  }
};

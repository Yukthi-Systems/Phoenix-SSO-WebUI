import { isValidOrigin } from '../utils/security';

/**
 * Reusable Iframe Authentication Manager for client apps to run silent session validations.
 */
export const iframeManager = {
  iframeElement: null,
  messageListener: null,
  timeoutTimer: null,

  /**
   * Performs silent auth check using a hidden iframe.
   * 
   * @param {string} ssoUrl - The centralized SSO base URL (e.g. "https://alen.test.yukthi.net")
   * @param {string} appName - The client application name (e.g. "app1")
   * @param {number} timeoutMs - Max timeout in milliseconds (default: 5000)
   * @returns {Promise<object>} Resolves on session validity, rejects on invalid session or timeout
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
      this.messageListener = (event) => {
        // Security checks
        if (!isValidOrigin(event.origin) && event.origin !== ssoUrl) {
          return;
        }

        const data = event.data;
        if (!data || typeof data !== 'object') return;

        // Process message results
        if (data.type === 'SSO_AUTH_SUCCESS') {
          resolve({ status: 'authenticated', data: data.payload || null });
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

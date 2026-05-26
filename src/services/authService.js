import apiClient from '../api/client';

function getDeviceDetails(ipAddress = '') {
  const ua = navigator.userAgent;
  let browserName = 'Unknown Browser';
  let osName = 'Unknown OS';

  // OS detection
  if (/Windows NT 10.0/.test(ua)) osName = 'Windows 10/11';
  else if (/Windows NT 6.2/.test(ua)) osName = 'Windows 8';
  else if (/Windows NT 6.1/.test(ua)) osName = 'Windows 7';
  else if (/Macintosh/.test(ua)) osName = 'macOS';
  else if (/iPhone|iPad|iPod/.test(ua)) osName = 'iOS';
  else if (/Android/.test(ua)) osName = 'Android';
  else if (/Linux/.test(ua)) osName = 'Linux';

  // Browser detection
  if (/Chrome\/([0-9.]+)/.test(ua)) {
    const match = ua.match(/Chrome\/([0-9.]+)/);
    browserName = `Chrome ${match ? match[1] : ''}`;
  } else if (/Firefox\/([0-9.]+)/.test(ua)) {
    const match = ua.match(/Firefox\/([0-9.]+)/);
    browserName = `Firefox ${match ? match[1] : ''}`;
  } else if (/Safari\/([0-9.]+)/.test(ua) && !/Chrome/.test(ua)) {
    const match = ua.match(/Version\/([0-9.]+)/);
    browserName = `Safari ${match ? match[1] : ''}`;
  } else if (/MSIE\/([0-9.]+)/.test(ua) || /Trident.*rv:([0-9.]+)/.test(ua)) {
    browserName = 'Internet Explorer';
  } else if (/Edg\/([0-9.]+)/.test(ua)) {
    const match = ua.match(/Edg\/([0-9.]+)/);
    browserName = `Edge ${match ? match[1] : ''}`;
  }

  const details = {
    os: osName,
    browser: browserName
  };

  if (ipAddress) {
    details.ip = ipAddress;
  }

  return details;
}

/**
 * Authentication service calling the SSO backend endpoints.
 * All cookies (secure HttpOnly) are set/sent automatically by the browser
 * due to apiClient configure (withCredentials = true).
 */
const authService = {
  /**
   * Triggers initial credentials check
   * @param {string} email 
   * @param {string} password 
   * @param {boolean} rememberMe 
   */
  async login(email, password, rememberMe) {
    let ipAddress = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout for IP check
      const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeoutId);
      const ipData = await ipRes.json();
      ipAddress = ipData.ip || '';
    } catch (err) {
      console.warn('IP fetch failed, proceeding without IP', err.message);
    }

    const deviceDetails = getDeviceDetails(ipAddress);

    const response = await apiClient.post('/auth/login', { 
      user_email: email, 
      password, 
      rememberMe,
      device_details: deviceDetails
    });
    return response.data;
    // Expected response format:
    // { requiresMfa: true, mfaType: 'email_otp'|'authenticator_otp', tempToken: '...' }
    // OR { success: true }
  },

  /**
   * Verifies the 6-digit OTP code (2FA/MFA)
   * @param {string} otpCode 
   * @param {string} tempToken - Optional temporary token associated with the login attempt
   */
  async verifyOtp(otpCode, tempToken) {
    const response = await apiClient.post('/verify-otp', { otpCode, tempToken });
    return response.data;
    // Expected response format:
    // { success: true }
  },

  /**
   * Requests a resend of the OTP code
   * @param {string} tempToken - Optional temporary token associated with the session
   */
  async resendOtp(tempToken) {
    const response = await apiClient.post('/resend-otp', { tempToken });
    return response.data;
  },

  /**
   * Validates if the current SSO cookie session is active
   */
  async validateSession() {
    const response = await apiClient.get('/auth/session');
    return response.data;
    // Expected response: { valid: true, user: { email: '...', ... } }
  },

  /**
   * Used for Silent Auth iframe checks
   * @param {string} app - The application identifier requesting session (e.g. "app1")
   */
  async generateSession(app) {
    const response = await apiClient.post('/generate-session', { app });
    return response.data;
    // Expected response: { success: true }
  },

  /**
   * Periodically rotates the active session cookies
   */
  async rotateSession() {
    const response = await apiClient.post('/rotate-session');
    return response.data;
    // Expected response: { success: true }
  },

  /**
   * Triggers global logout
   */
  async logout() {
    const response = await apiClient.post('/logout');
    return response.data;
    // Expected response: { success: true }
  }
};

export default authService;

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

import apiClient from '../api/client';
import axios from 'axios';
import type { DeviceDetails } from '../types';

// A handful of client-hint / device-fingerprint APIs aren't in the standard
// DOM lib types yet — narrow, local casts instead of a blanket Navigator override.
function getDeviceDetails(ipAddress = ''): DeviceDetails {
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

  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language || navigator.userLanguage || 'Unknown';
  const acceptLanguage = navigator.languages ? navigator.languages.join(',') : language;
  const platform = navigator.platform || 'Unknown';
  let timeZone = 'Unknown';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // ignore
  }
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const colorDepth = window.screen.colorDepth;

  let secChUa = '';
  let secChUaMobile = '';
  let secChUaPlatform = '';

  const userAgentData = navigator.userAgentData;
  if (userAgentData) {
    secChUa = userAgentData.brands.map((b) => `"${b.brand}";v="${b.version}"`).join(', ');
    secChUaMobile = userAgentData.mobile ? '?1' : '?0';
    secChUaPlatform = `"${userAgentData.platform}"`;
  }

  const hardwareConcurrency = navigator.hardwareConcurrency || 'Unknown';
  const deviceMemory = navigator.deviceMemory || 'Unknown';
  const connectionType = navigator.connection ? navigator.connection.effectiveType : 'Unknown';
  const cookieEnabled = navigator.cookieEnabled;
  const doNotTrack = navigator.doNotTrack || 'Unknown';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const vendor = navigator.vendor || 'Unknown';
  const product = navigator.product || 'Unknown';
  const productSub = navigator.productSub || 'Unknown';
  const appVersion = navigator.appVersion || 'Unknown';
  const pixelRatio = window.devicePixelRatio || 1;
  const viewportResolution = `${window.innerWidth}x${window.innerHeight}`;
  const javaEnabled = typeof navigator.javaEnabled === 'function' ? navigator.javaEnabled() : false;
  const pdfViewerEnabled = navigator.pdfViewerEnabled || false;
  const pluginsCount = navigator.plugins ? navigator.plugins.length : 0;
  const mimesCount = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
  const timezoneOffset = new Date().getTimezoneOffset();
  const localStorageEnabled = typeof window.localStorage !== 'undefined';
  const sessionStorageEnabled = typeof window.sessionStorage !== 'undefined';
  const webdriver = navigator.webdriver || false;

  const details: DeviceDetails = {
    os: osName,
    browser: browserName,
    screenResolution,
    language,
    acceptLanguage,
    platform,
    timeZone,
    isMobile,
    colorDepth,
    userAgent: ua,
    secChUa,
    secChUaMobile,
    secChUaPlatform,
    hardwareConcurrency,
    deviceMemory,
    connectionType,
    cookieEnabled,
    doNotTrack,
    maxTouchPoints,
    vendor,
    product,
    productSub,
    appVersion,
    pixelRatio,
    viewportResolution,
    javaEnabled,
    pdfViewerEnabled,
    pluginsCount,
    mimesCount,
    timezoneOffset,
    localStorageEnabled,
    sessionStorageEnabled,
    webdriver
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
   */
  async login(email: string, password: string, rememberMe: boolean) {
    let ipAddress = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout for IP check
      const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeoutId);
      const ipData = await ipRes.json();
      ipAddress = ipData.ip || '';
    } catch (err) {
      console.warn('IP fetch failed, proceeding without IP', (err as Error).message);
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
   * Validates if the current SSO cookie session is active
   */
  async validateSession() {
    const response = await apiClient.get('/auth/session');
    return response.data;
    // Expected response: { valid: true, user: { email: '...', ... } }
  },

  /**
   * Used for Silent Auth iframe checks
   * @param app - The application identifier requesting session (e.g. "app1")
   */
  async generateSession(_app: string | null) {
    const response = await apiClient.get('/auth/session');
    return response.data;
    // Expected response: { success: true }
  },

  /**
   * Triggers global logout
   */
  async logout() {
    const response = await apiClient.delete('/auth/logout', {
      withCredentials: true
    });
    return response.data;
    // Expected response: { success: true }
  },

  /**
   * Validates the 6-digit OTP code against the backend
   * @param otpType - 'app' | 'sms' | 'email'
   * @param otp - 6-digit code
   */
  async validateOtp(otpType: string, otp: string) {
    const response = await apiClient.post(`/auth/otp/validate/${otpType}/${otp}`);
    return response.data;
  },

  /**
   * Triggers resending the OTP code
   * @param otpType - 'app' | 'sms' | 'email'
   */
  async resendOtp(otpType: string) {
    const response = await apiClient.post(`/auth/otp/resend/${otpType}`);
    return response.data;
  },

  /**
   * Updates the last active timestamp on the server
   */
  async updateLastActive() {
    const response = await apiClient.post('/auth/last-active');
    return response.data;
  },

  /**
   * Initiates a password reset flow by sending an OTP to the given email.
   * @param email - The user's email address
   * @param verify_via - Method to verify, default to 'email'
   * @param recaptcha_token - Optional recaptcha token
   */
  async requestPasswordReset(email: string, verify_via = 'email', recaptcha_token = '') {
    const response = await axios.post(`https://v3-admin-api.test.yukthi.net/identities/reset/password/${email}/init?verify_via=${verify_via}&recaptcha_token=${recaptcha_token}`);
    return response.data;
    // Expected response: { message: '...', verify_via: 'email' }
  },

  /**
   * Finalises the password reset by submitting the OTP and new password.
   * @param email - The user's email address
   * @param otp - 6-digit OTP code entered by the user
   * @param newPassword - The user's chosen new password
   * @param verify_via - Method to verify, default to 'email'
   */
  async completePasswordReset(email: string, otp: string, newPassword: string, verify_via = 'email') {
    const response = await axios.post(`https://v3-admin-api.test.yukthi.net/identities/reset/password/${email}/complete`, {
      otp: otp,
      new_password_base64: btoa(newPassword),
      verify_via: verify_via
    });
    return response.data;
    // Expected response: { message: '...' }
  }
};

export default authService;

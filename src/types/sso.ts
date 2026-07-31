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

// Device fingerprint sent alongside login requests (src/services/authService.ts).
export interface DeviceDetails {
  os: string;
  browser: string;
  screenResolution: string;
  language: string;
  acceptLanguage: string;
  platform: string;
  timeZone: string;
  isMobile: boolean;
  colorDepth: number;
  userAgent: string;
  secChUa: string;
  secChUaMobile: string;
  secChUaPlatform: string;
  hardwareConcurrency: number | string;
  deviceMemory: number | string;
  connectionType: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  maxTouchPoints: number;
  vendor: string;
  product: string;
  productSub: string;
  appVersion: string;
  pixelRatio: number;
  viewportResolution: string;
  javaEnabled: boolean;
  pdfViewerEnabled: boolean;
  pluginsCount: number;
  mimesCount: number;
  timezoneOffset: number;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
  webdriver: boolean;
  ip?: string;
}

// postMessage contract shared between popup/iframe login pages and the
// parent apps that embed them (src/services/popupManager.ts, iframeManager.ts,
// src/pages/SilentAuth.tsx and friends).
export type SsoMessageType =
  | 'SSO_AUTH_SUCCESS'
  | 'SSO_AUTH_FAILED'
  | 'SSO_SESSION_EXPIRED'
  | 'SSO_LOGOUT';

export interface SsoMessage {
  type: SsoMessageType;
  message?: string;
  payload?: unknown;
}

export interface PopupAuthResult {
  status: 'success';
}

export interface SilentAuthResult {
  status: 'authenticated';
  data: unknown;
}

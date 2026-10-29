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

export type SSOStatus = 'checking' | 'authenticated' | 'unauthenticated';

export interface SSOAppearance {
  /**
   * Forces the SSO UI's initial color theme instead of letting it fall back to
   * the visitor's saved preference or OS setting — use this to match your
   * app's current theme (e.g. in a popup or embedded redirect).
   */
  theme?: 'dark' | 'light';
  /**
   * Brand color (hex, e.g. "#4f46e5") applied to the SSO UI's primary accent
   * and buttons in place of the default branding. Invalid values are ignored.
   */
  themeColor?: string;
}

export interface SSOConfig extends SSOAppearance {
  /** Base URL of the hosted Yukthi SSO service, e.g. "https://sso.yukthi.net" */
  ssoUrl: string;
  /** Identifier for this application, sent to the SSO service as the `app` param */
  appId: string;
  /** Timeout for the silent (iframe) session check on mount, in ms. Default: 5000 */
  silentAuthTimeoutMs?: number;
}

// Wire contract with the SSO service's popup/silent-auth pages — matches the
// postMessage payloads sent by sso.yukthi.net's Login/SilentAuth pages.
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

// GET {ssoUrl}/auth/session response
export interface SSOSession {
  message: string;
  email: string;
  first_name: string;
  last_name: string | null;
  organization_id: string;
  organization_name: string;
}

// POST {ssoUrl}/auth/refresh response
export interface SSORefreshResult {
  message: string;
  /** New cookie expiry, as a Unix timestamp in seconds */
  expiration: number;
}

// GET {ssoUrl}/user/my-info response
export interface SSOUserInfo {
  email: string;
  domain_name: string;
  first_name: string;
  last_name: string | null;
  employee_id: string | null;
  primary_phone: string;
  secondary_email: string | null;
  is_app_2fa_enabled: boolean;
  is_sms_2fa_enabled: boolean;
  is_email_2fa_enabled: boolean;
}

export interface SSOAuthContextValue {
  status: SSOStatus;
  error: string | null;
  /** Opens the SSO login popup and resolves once authenticated. */
  signIn: () => Promise<void>;
  /**
   * Invalidates the SSO service's session and clears local SSO state.
   * Resolves once cleanup is complete, even if the SSO logout request itself
   * fails (local state is always reset — see console warnings for failures).
   */
  signOut: () => Promise<void>;
}

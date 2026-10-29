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

import type { SSOSession, SSOUserInfo, SSORefreshResult } from '../types';

/**
 * Calls an SSO endpoint with the SSO cookie attached. Resolves `null` on 401
 * (no session, or a session still waiting on 2FA) so callers can tell
 * "signed out" apart from "SSO unreachable", which throws instead.
 */
async function requestWithSession<T>(url: string, method: 'GET' | 'POST'): Promise<T | null> {
  const response = await fetch(url, {
    method,
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`SSO request to ${url} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

/**
 * Checks whether the SSO session cookie is valid and returns the signed-in
 * user's session details, or `null` if there's no active session.
 * Throws on network failure or a non-401 error status.
 */
export function validateSession(ssoUrl: string): Promise<SSOSession | null> {
  return requestWithSession<SSOSession>(`${ssoUrl}/auth/session`, 'GET');
}

/**
 * Extends the SSO session: the SSO service re-issues the session cookie with
 * a fresh expiry. Resolves with the new expiration, or `null` if there's no
 * active session to extend. Throws on network failure or a non-401 error status.
 */
export function refreshSession(ssoUrl: string): Promise<SSORefreshResult | null> {
  return requestWithSession<SSORefreshResult>(`${ssoUrl}/auth/refresh`, 'POST');
}

/**
 * Fetches the signed-in user's profile fresh from the SSO service's database
 * (not the cached session), or `null` if there's no active session.
 * Throws on network failure or a non-401 error status.
 */
export function getUserInfo(ssoUrl: string): Promise<SSOUserInfo | null> {
  return requestWithSession<SSOUserInfo>(`${ssoUrl}/user/my-info`, 'GET');
}

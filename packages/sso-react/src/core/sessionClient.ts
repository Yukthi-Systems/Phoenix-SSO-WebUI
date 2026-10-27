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

import type { SSOSession, SSOUserInfo } from '../types';

/**
 * GETs an SSO endpoint with the SSO cookie attached. Resolves `null` on 401
 * (no session, or a session still waiting on 2FA) so callers can tell
 * "signed out" apart from "SSO unreachable", which throws instead.
 */
async function getWithSession<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    method: 'GET',
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
  return getWithSession<SSOSession>(`${ssoUrl}/auth/session`);
}

/**
 * Fetches the signed-in user's profile fresh from the SSO service's database
 * (not the cached session), or `null` if there's no active session.
 * Throws on network failure or a non-401 error status.
 */
export function getUserInfo(ssoUrl: string): Promise<SSOUserInfo | null> {
  return getWithSession<SSOUserInfo>(`${ssoUrl}/user/my-info`);
}

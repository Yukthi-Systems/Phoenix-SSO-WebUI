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

/**
 * Calls the SSO service's own logout endpoint to invalidate the SSO session
 * cookie. Throws on a non-2xx response or network failure — same as the
 * axios-based calls this replaces, so existing try/catch call sites keep
 * working unchanged.
 */
export async function ssoLogout(ssoUrl: string): Promise<void> {
  const response = await fetch(`${ssoUrl}/auth/logout`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`SSO logout failed with status ${response.status}`);
  }
}

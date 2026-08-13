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

import type { SSOAppearance } from '../types';
import { applyAppearanceParams } from './appearance';

export interface RedirectToLoginOptions extends SSOAppearance {
  /** Where the SSO service should send the browser back after login. Defaults to the current page URL. */
  returnTo?: string;
}

/** Builds the full-page (non-popup) SSO login URL. */
export function buildLoginRedirectUrl(ssoUrl: string, appId: string, returnTo: string, appearance?: SSOAppearance): string {
  const url = new URL(`${ssoUrl}/login`);
  url.searchParams.set('app', appId);
  url.searchParams.set('redirect_uri', returnTo);
  applyAppearanceParams(url, appearance);
  return url.toString();
}

/**
 * Navigates the whole page to the SSO login screen instead of opening a
 * popup — the fallback for when openLoginPopup() rejects with a
 * PopupBlockedError. The SSO service redirects back to `returnTo` (default:
 * the current page) once login completes.
 */
export function redirectToLogin(ssoUrl: string, appId: string, options: RedirectToLoginOptions = {}): void {
  const returnTo = options.returnTo ?? window.location.href;
  window.location.href = buildLoginRedirectUrl(ssoUrl, appId, returnTo, options);
}

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

export { SSOProvider } from './SSOProvider';
export type { SSOProviderProps } from './SSOProvider';

export { useSSOAuth } from './useSSOAuth';

export { SignInButton } from './components/SignInButton';
export type { SignInButtonProps } from './components/SignInButton';

export { SignedIn } from './components/SignedIn';
export { SignedOut } from './components/SignedOut';

export { ProtectedRoute } from './components/ProtectedRoute';
export type { ProtectedRouteProps } from './components/ProtectedRoute';

// Framework-free primitives, for apps that already own their auth state and
// only want the popup/silent-auth handshake itself (no <SSOProvider> needed).
export { openLoginPopup, cancelLoginPopup, PopupBlockedError } from './core/popupClient';
export type { OpenLoginPopupOptions } from './core/popupClient';
export { checkSilentAuth, cancelSilentAuth } from './core/silentAuthClient';
export { ssoLogout } from './core/logoutClient';
export { validateSession, getUserInfo, refreshSession } from './core/sessionClient';
export { redirectToLogin, buildLoginRedirectUrl } from './core/redirectClient';
export type { RedirectToLoginOptions } from './core/redirectClient';

export type {
  SSOConfig,
  SSOAppearance,
  SSOStatus,
  SSOAuthContextValue,
  SsoMessage,
  SsoMessageType,
  SSOSession,
  SSOUserInfo,
  SSORefreshResult,
} from './types';

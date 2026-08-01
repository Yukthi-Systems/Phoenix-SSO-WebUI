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
export { redirectToLogin, buildLoginRedirectUrl } from './core/redirectClient';
export type { RedirectToLoginOptions } from './core/redirectClient';

export type {
  SSOConfig,
  SSOStatus,
  SSOAuthContextValue,
  SsoMessage,
  SsoMessageType,
} from './types';

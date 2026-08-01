export interface RedirectToLoginOptions {
  /** Where the SSO service should send the browser back after login. Defaults to the current page URL. */
  returnTo?: string;
}

/** Builds the full-page (non-popup) SSO login URL. */
export function buildLoginRedirectUrl(ssoUrl: string, appId: string, returnTo: string): string {
  const url = new URL(`${ssoUrl}/login`);
  url.searchParams.set('app', appId);
  url.searchParams.set('redirect_uri', returnTo);
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
  window.location.href = buildLoginRedirectUrl(ssoUrl, appId, returnTo);
}

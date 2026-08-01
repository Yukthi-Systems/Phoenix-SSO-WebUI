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

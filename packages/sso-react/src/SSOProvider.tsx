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

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SSOContext } from './SSOContext';
import { openLoginPopup, cancelLoginPopup, PopupBlockedError } from './core/popupClient';
import { checkSilentAuth, cancelSilentAuth } from './core/silentAuthClient';
import { ssoLogout } from './core/logoutClient';
import { redirectToLogin } from './core/redirectClient';
import type { SSOAuthContextValue, SSOConfig, SSOStatus } from './types';

export interface SSOProviderProps extends SSOConfig {
  children: ReactNode;
  /**
   * Called after the SSO handshake succeeds (popup sign-in or silent check).
   * This is where your app exchanges the SSO session for its own tokens
   * against its own backend — the package intentionally has no opinion on
   * that contract. `status` only flips to "authenticated" after this resolves.
   */
  onAuthenticated?: () => void | Promise<void>;
  /**
   * Called when signOut() runs, before the SSO service's own session is
   * invalidated and before local status is reset. Use this for your app's
   * own backend logout call and any local cleanup (query cache, sockets, etc).
   */
  onSignOut?: () => void | Promise<void>;
  /** Skip the automatic silent (iframe) session check on mount. Default: false. */
  skipInitialCheck?: boolean;
}

export function SSOProvider({
  children,
  ssoUrl,
  appId,
  silentAuthTimeoutMs,
  onAuthenticated,
  onSignOut,
  skipInitialCheck = false,
}: SSOProviderProps) {
  const [status, setStatus] = useState<SSOStatus>(skipInitialCheck ? 'unauthenticated' : 'checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skipInitialCheck) return;
    let cancelled = false;

    checkSilentAuth(ssoUrl, appId, silentAuthTimeoutMs)
      .then(async () => {
        if (cancelled) return;
        await onAuthenticated?.();
        if (!cancelled) setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
      cancelSilentAuth();
    };
    // Re-running on every onAuthenticated identity change would re-trigger the
    // silent check whenever the caller passes an inline callback; only ssoUrl/
    // appId identify a distinct SSO configuration worth re-checking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssoUrl, appId, skipInitialCheck, silentAuthTimeoutMs]);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await openLoginPopup(ssoUrl, appId);
    } catch (err) {
      if (err instanceof PopupBlockedError) {
        // Fall back to a full-page redirect instead of surfacing an error —
        // the browser navigates away, so this call never needs to resolve.
        // On return, the mount-time silent check picks up the new session.
        redirectToLogin(ssoUrl, appId);
        return new Promise<void>(() => {});
      }
      setError((err as Error).message || 'Sign in failed.');
      setStatus('unauthenticated');
      throw err;
    }

    try {
      await onAuthenticated?.();
      setStatus('authenticated');
    } catch (err) {
      setError((err as Error).message || 'Sign in failed.');
      setStatus('unauthenticated');
      throw err;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssoUrl, appId]);

  const signOut = useCallback(async () => {
    cancelLoginPopup();
    cancelSilentAuth();

    try {
      await onSignOut?.();
    } catch (err) {
      console.warn('onSignOut callback failed:', err);
    }

    try {
      await ssoLogout(ssoUrl);
    } catch (err) {
      console.warn('SSO logout request failed:', err);
    } finally {
      setStatus('unauthenticated');
      setError(null);
    }
  }, [ssoUrl, onSignOut]);

  const value = useMemo<SSOAuthContextValue>(() => ({
    status,
    error,
    signIn,
    signOut,
  }), [status, error, signIn, signOut]);

  return <SSOContext.Provider value={value}>{children}</SSOContext.Provider>;
}

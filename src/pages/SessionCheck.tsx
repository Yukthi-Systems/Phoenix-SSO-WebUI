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

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { isValidOrigin, sanitizeRedirectUrl } from '../utils/security';

export default function SessionCheck() {
  const { checkSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isPopup = searchParams.get('mode') === 'popup';
  const redirectUri = searchParams.get('redirect_uri');
  const targetOrigin = searchParams.get('origin');

  useEffect(() => {
    const runCheck = async () => {
      // 1. Immediately check for SSO-Session-ID browser cookie
      const hasSsoSession = document.cookie.split(';').some(item => item.trim().startsWith('SSO-Session-ID='));
      if (hasSsoSession) {
        navigate('/authenticated', { replace: true });
        return;
      }

      // 2. Trigger session lookup
      const valid = await checkSession();

      if (valid) {
        // 3. Session active -> proceed to success coordinates
        if (isPopup) {
          const origin = targetOrigin || (window.opener ? '*' : null);
          if (origin && (origin === '*' || isValidOrigin(origin))) {
            window.opener.postMessage({ type: 'SSO_AUTH_SUCCESS' }, origin);
            window.close();
          } else {
            console.error('Popup target origin unauthorized:', origin);
            navigate('/unauthorized');
          }
        } else if (redirectUri) {
          const sanitized = sanitizeRedirectUrl(redirectUri);
          window.location.href = sanitized;
        } else {
          // No destination target. Show safe authenticated portal card.
          navigate('/authenticated', { replace: true });
        }
      } else {
        // 4. No active session -> route to login, preserving context params
        navigate(`/login?${searchParams.toString()}`, { replace: true });
      }
    };

    runCheck();
  }, [checkSession, isPopup, redirectUri, targetOrigin, navigate, searchParams]);

  // Visual placeholder while verifying session cookies
  return (
    <AuthLayout>
      <div className="text-center py-2.5">
        <h2 className="text-lg font-semibold mb-4 text-text-main">
          Verifying security session...
        </h2>
        <LoadingSkeleton lines={2} />
      </div>
    </AuthLayout>
  );
}

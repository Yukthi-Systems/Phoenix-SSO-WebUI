import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import AuthLayout from '../layouts/AuthLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { isValidOrigin, sanitizeRedirectUrl } from '../utils/security';

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isPopup = searchParams.get('mode') === 'popup';
  const redirectUri = searchParams.get('redirect_uri');
  const targetOrigin = searchParams.get('origin');

  useEffect(() => {
    const runLogout = async () => {
      try {
        // 1. Call backend logout API
        await authService.logout();
      } catch (err) {
        console.warn('Logout request completed with warning:', err.message);
      } finally {
        // 2. Broadcast logout message if opener app exists
        const origin = targetOrigin || (window.opener ? '*' : null);
        if (isPopup && origin && (origin === '*' || isValidOrigin(origin))) {
          window.opener.postMessage({ type: 'SSO_LOGOUT' }, origin);
          window.close();
          return;
        }

        // 3. Clear local states and redirect
        if (redirectUri) {
          const sanitized = sanitizeRedirectUrl(redirectUri);
          // Redirect to client app
          window.location.href = sanitized;
        } else {
          // Redirect to SSO login
          navigate('/login', { replace: true });
        }
      }
    };

    runLogout();
  }, [isPopup, redirectUri, targetOrigin, navigate]);

  return (
    <AuthLayout>
      <div className="text-center py-2.5">
        <h2 className="text-lg font-semibold mb-4 text-text-main">
          Logging you out safely...
        </h2>
        <LoadingSkeleton lines={1} />
      </div>
    </AuthLayout>
  );
}

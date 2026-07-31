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

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { isValidOrigin } from '../utils/security';

export default function SessionExpired() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isPopup = searchParams.get('mode') === 'popup';
  const targetOrigin = searchParams.get('origin');

  useEffect(() => {
    // Notify parent apps of session expiration
    const origin = targetOrigin || (window.opener ? '*' : null);
    if (isPopup && origin && (origin === '*' || isValidOrigin(origin))) {
      window.opener.postMessage({ type: 'SSO_SESSION_EXPIRED' }, origin);
    }
  }, [isPopup, targetOrigin]);

  const handleLoginClick = () => {
    navigate(`/login?${searchParams.toString()}`);
  };

  return (
    <AuthLayout>
      <div className="text-center">
        {/* Clock/expired icon */}
        <div 
          className="w-14 h-14 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-5"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
        </div>

        <h2 className="text-xl font-semibold mb-2 text-text-main">
          Session Expired
        </h2>
        <p className="text-[0.875rem] text-text-sub mb-6">
          Your active security session has expired due to inactivity. Please sign in again to continue.
        </p>

        <button 
          type="button" 
          className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 relative overflow-hidden bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] focus:outline-none focus:ring-4 focus:ring-primary/20"
          onClick={handleLoginClick}
        >
          Sign In Again
        </button>
      </div>
    </AuthLayout>
  );
}

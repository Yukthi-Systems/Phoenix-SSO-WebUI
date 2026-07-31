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

export default function MfaVerification() {
  const { tempMfaData, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!tempMfaData && !loading) {
      navigate('/login');
    }
  }, [tempMfaData, loading, navigate]);

  const handleSelectMethod = (type) => {
    // Navigate to verify page preserving query params
    const queryParams = new URLSearchParams(searchParams);
    queryParams.set('mfa_type', type);
    navigate(`/verify-otp?${queryParams.toString()}`);
  };

  const handleBack = () => {
    const queryParams = new URLSearchParams(searchParams);
    navigate(`/login?${queryParams.toString()}`);
  };

  const options = [];
  if (tempMfaData?.is_app_2fa_enabled) {
    options.push({
      type: 'app',
      title: 'Authenticator App',
      description: 'Get a verification code from your Google/Microsoft app.',
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      ),
      bg: 'bg-indigo-500/10 text-primary'
    });
  }

  if (tempMfaData?.is_sms_2fa_enabled) {
    options.push({
      type: 'sms',
      title: 'SMS Verification Code',
      description: `Send a 6-digit verification code to ${tempMfaData.primary_phone || 'your phone'}.`,
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      bg: 'bg-green-500/10 text-success'
    });
  }

  if (tempMfaData?.is_email_2fa_enabled) {
    options.push({
      type: 'email',
      title: 'Email Verification Code',
      description: `Send a 6-digit verification code to ${tempMfaData.secondary_email || tempMfaData.email || 'your email'}.`,
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      bg: 'bg-cyan-500/10 text-accent'
    });
  }

  return (
    <AuthLayout>
      <div>
        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-main text-sm font-medium mb-5 bg-transparent border-none cursor-pointer transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Back to login"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="transition-transform group-hover:-translate-x-0.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Login
        </button>

        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-text-main">
            Select Verification Method
          </h2>
          <p className="text-[0.85rem] text-text-sub mb-6">
            Choose a secure verification method to confirm your login session.
          </p>

          <div className="flex flex-col gap-3">
            {options.map((opt) => (
              <button
                key={opt.type}
                type="button"
                className="w-full bg-white/5 text-text-main border border-card-border hover:bg-white/10 rounded-xl p-4 flex items-center justify-start gap-4 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                onClick={() => handleSelectMethod(opt.type)}
                disabled={loading}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${opt.bg}`}>
                  {opt.icon}
                </div>
                <div>
                  <div className="font-semibold text-[0.95rem] text-text-main">{opt.title}</div>
                  <div className="text-xs text-text-muted mt-0.5">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

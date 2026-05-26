import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';

export default function MfaVerification() {
  const { mfaType, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSelectMethod = (type) => {
    // Navigate to verify page preserving query params
    const queryParams = new URLSearchParams(searchParams);
    queryParams.set('mfa_type', type);
    navigate(`/verify-otp?${queryParams.toString()}`);
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-text-main">
          Select Verification Method
        </h2>
        <p className="text-[0.85rem] text-text-sub mb-6">
          Choose a secure verification method to confirm your login session.
        </p>

        <div className="flex flex-col gap-3">
          {/* Option 1: Authenticator App */}
          <button
            type="button"
            className="w-full bg-white/5 text-text-main border border-card-border hover:bg-white/10 rounded-xl p-4 flex items-center justify-start gap-4 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            onClick={() => handleSelectMethod('authenticator_otp')}
            disabled={loading}
          >
            <div 
              className="w-10 h-10 rounded-lg bg-indigo-500/10 text-primary flex items-center justify-center shrink-0"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[0.95rem] text-text-main">Authenticator App</div>
              <div className="text-xs text-text-muted mt-0.5">Get a verification code from your Google/Microsoft app.</div>
            </div>
          </button>

          {/* Option 2: Email OTP */}
          <button
            type="button"
            className="w-full bg-white/5 text-text-main border border-card-border hover:bg-white/10 rounded-xl p-4 flex items-center justify-start gap-4 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            onClick={() => handleSelectMethod('email_otp')}
            disabled={loading}
          >
            <div 
              className="w-10 h-10 rounded-lg bg-cyan-500/10 text-accent flex items-center justify-center shrink-0"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-[0.95rem] text-text-main">Email Verification Code</div>
              <div className="text-xs text-text-muted mt-0.5">Send a 6-digit verification code to your registered inbox.</div>
            </div>
          </button>
        </div>

        <button
          type="button"
          className="w-full mt-6 bg-transparent border-none text-text-sub hover:text-text-main font-medium text-sm py-2 rounded-xl transition-colors cursor-pointer"
          onClick={() => navigate('/login')}
          disabled={loading}
        >
          Cancel and return
        </button>
      </div>
    </AuthLayout>
  );
}

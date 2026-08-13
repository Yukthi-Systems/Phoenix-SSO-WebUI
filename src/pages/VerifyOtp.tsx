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

import { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent, type ClipboardEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import AuthLayout from '../layouts/AuthLayout';
import { isValidOrigin, sanitizeRedirectUrl } from '../utils/security';
import Button from '../components/ui/Button';
import StatusBanner from '../components/ui/StatusBanner';
import type { ApiError, OtpType } from '../types';

// Extracts the human-readable message from an API error response
function extractErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (!err) return fallback;
  const apiErr = err as ApiError & { response?: { data?: unknown } };
  // Axios interceptor shapes errors into { message, status, ... }
  if (typeof apiErr.message === 'string' && apiErr.message) return apiErr.message;
  // Raw axios error with a response body
  if (apiErr.response?.data) {
    const d = apiErr.response.data as Record<string, unknown> | string;
    if (typeof d === 'string') return d;
    return (d.message as string) || (d.error as string) || (d.detail as string) || fallback;
  }
  return fallback;
}

export default function VerifyOtp() {
  const { verifyOtp, resendOtp, tempMfaData, isAuthenticated, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 6-digit OTP state array
  const [otpVal, setOtpVal] = useState(new Array(6).fill(''));
  const [mfaError, setMfaError] = useState('');
  const [mfaInfo, setMfaInfo] = useState(''); // info message (e.g. sending code...)

  // Timer countdown: 60 seconds resend cooldown
  const { secondsLeft, isRunning, reset: resetTimer } = useCountdown(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Flow parameters
  const redirectUri = searchParams.get('redirect_uri');
  const targetOrigin = searchParams.get('origin');

  // Determine correct MFA type (app, sms, email)
  const mfaTypeParam = searchParams.get('mfa_type');
  let otpType: OtpType = 'app';
  if (mfaTypeParam === 'app' || mfaTypeParam === 'sms' || mfaTypeParam === 'email') {
    otpType = mfaTypeParam;
  } else if (tempMfaData) {
    if (tempMfaData.is_app_2fa_enabled) otpType = 'app';
    else if (tempMfaData.is_sms_2fa_enabled) otpType = 'sms';
    else if (tempMfaData.is_email_2fa_enabled) otpType = 'email';
  }

  // Count how many MFA methods are enabled to decide where back navigates
  const mfaMethodCount = tempMfaData
    ? [tempMfaData.is_app_2fa_enabled, tempMfaData.is_sms_2fa_enabled, tempMfaData.is_email_2fa_enabled].filter(Boolean).length
    : 0;

  const handleBack = () => {
    const queryParams = new URLSearchParams(searchParams);
    queryParams.delete('mfa_type');
    if (mfaMethodCount > 1) {
      navigate(`/mfa-verification?${queryParams.toString()}`);
    } else {
      navigate(`/login?${queryParams.toString()}`);
    }
  };

  const handleSuccessNavigation = useCallback(() => {
    const isPopupMode = searchParams.get('mode') === 'popup';
    if (isPopupMode) {
      const origin = targetOrigin || (window.opener ? '*' : null);
      if (origin && (origin === '*' || isValidOrigin(origin))) {
        window.opener.postMessage({ type: 'SSO_AUTH_SUCCESS' }, origin);
        window.close();
      } else {
        navigate('/unauthorized');
      }
    } else if (redirectUri) {
      const sanitized = sanitizeRedirectUrl(redirectUri);
      window.location.href = sanitized;
    } else {
      navigate('/session-check');
    }
  }, [navigate, searchParams, targetOrigin, redirectUri]);

  const hasTriggered = useRef(false);

  // Mount-only: clear stale state and trigger the first OTP send
  // This runs ONCE. Never re-runs, so it never clears errors set by submit/resend.
  useEffect(() => {
    clearError();
    // Resetting local UI state on mount, not deriving it from props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMfaError('');
    setMfaInfo('');

    if (otpType === 'app' || otpType === 'sms' || otpType === 'email') {
      hasTriggered.current = true;
      setMfaInfo('Sending verification code…');
      resendOtp(otpType)
        .then(() => setMfaInfo(''))
        .catch(err => {
          setMfaInfo('');
          setMfaError(extractErrorMessage(err, 'Failed to send verification code.'));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manage timer and focus when otpType changes (e.g. user navigates back to pick different method)
  useEffect(() => {
    resetTimer(60);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [otpType, resetTimer]);

  // Navigate on success
  useEffect(() => {
    if (isAuthenticated) {
      handleSuccessNavigation();
    }
  }, [isAuthenticated, handleSuccessNavigation]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return; // Allow numeric values only

    const newOtp = [...otpVal];
    // Keep only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtpVal(newOtp);

    // Auto-focus next input box if filled
    if (newOtp[index] !== '' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpVal];

      // If current field has content, clear it. Otherwise, clear previous and focus previous
      if (newOtp[index] !== '') {
        newOtp[index] = '';
        setOtpVal(newOtp);
      } else if (index > 0 && inputRefs.current[index - 1]) {
        newOtp[index - 1] = '';
        setOtpVal(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Check if pasted value is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const pasteArray = pastedData.split('');
      setOtpVal(pasteArray);
      setMfaError('');

      // Move focus to the last box
      inputRefs.current[5]?.focus();
    } else {
      setMfaError('Please paste a valid 6-digit numeric code.');
    }
  };

  const handleResend = async () => {
    if (isRunning) return;

    try {
      setMfaError('');
      setMfaInfo('Sending a new code…');
      await resendOtp(otpType);
      setMfaInfo('');
      resetTimer(60); // Reset timer to 60s
    } catch (err) {
      setMfaInfo('');
      setMfaError(extractErrorMessage(err, 'Failed to resend code.'));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullCode = otpVal.join('');

    if (fullCode.length < 6) {
      setMfaError('Please complete all 6 digits of the code.');
      return;
    }

    try {
      setMfaError('');
      setMfaInfo('');
      await verifyOtp(otpType, fullCode);
      handleSuccessNavigation();
    } catch (err) {
      setMfaError(extractErrorMessage(err, 'OTP verification failed. Please try again.'));
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>

        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          disabled={loading}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-main text-sm font-medium mb-5 bg-transparent border-none cursor-pointer transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={mfaMethodCount > 1 ? 'Back to method selection' : 'Back to login'}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="transition-transform group-hover:-translate-x-0.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          {mfaMethodCount > 1 ? 'Other Methods' : 'Back to Login'}
        </button>

        <h2 className="text-xl font-semibold text-center mb-2 text-text-main">
          Verify Your Identity
        </h2>
        <p className="text-[0.85rem] text-center text-text-sub mb-6">
          {otpType === 'app' && 'We sent a verification code to your Authenticator app device.'}
          {otpType === 'sms' && `We sent a 6-digit code to your phone ${tempMfaData?.primary_phone || ''}.`}
          {otpType === 'email' && `We sent a 6-digit code to your email ${tempMfaData?.secondary_email || tempMfaData?.email || ''}.`}
        </p>

        {/* Info / sending state */}
        {mfaInfo && !mfaError && (
          <StatusBanner
            variant="info"
            className="mb-4"
            icon={<span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin shrink-0" aria-hidden="true" />}
          >
            {mfaInfo}
          </StatusBanner>
        )}

        {/* Errors display */}
        {mfaError && (
          <StatusBanner
            variant="error"
            className="mb-5"
            icon={
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            }
          >
            {mfaError}
          </StatusBanner>
        )}

        {/* 6 Digit Input Group */}
        <div className="flex justify-between gap-2.5 my-6">
          {otpVal.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-surface-inset-strong border border-card-border text-text-main outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={loading}
              aria-label={`Digit ${index + 1}`}
              required
            />
          ))}
        </div>

        {/* Action Button */}
        <Button type="submit" className="mb-5" loading={loading} loadingText="Verifying...">
          Verify Code
        </Button>

        {/* Resend Action */}
        <div className="flex justify-between items-center text-sm mt-2">
          <span className="text-text-muted">Didn't receive a code?</span>
          {isRunning ? (
            <span className="text-text-sub font-semibold">
              Resend in {secondsLeft}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="bg-transparent border-none text-primary hover:text-primary-hover cursor-pointer font-semibold text-sm hover:underline"
              disabled={loading}
            >
              Resend Code
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}

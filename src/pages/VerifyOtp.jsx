import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import AuthLayout from '../layouts/AuthLayout';
import { isValidOrigin, sanitizeRedirectUrl } from '../utils/security';

// Extracts the human-readable message from an API error response
function extractErrorMessage(err, fallback = 'An unexpected error occurred.') {
  if (!err) return fallback;
  // Axios interceptor shapes errors into { message, status, ... }
  if (typeof err.message === 'string' && err.message) return err.message;
  // Raw axios error with a response body
  if (err.response?.data) {
    const d = err.response.data;
    if (typeof d === 'string') return d;
    return d.message || d.error || d.detail || fallback;
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

  const inputRefs = useRef([]);

  // Flow parameters
  const redirectUri = searchParams.get('redirect_uri');
  const targetOrigin = searchParams.get('origin');

  // Determine correct MFA type (app, sms, email)
  const mfaTypeParam = searchParams.get('mfa_type');
  let otpType = 'app';
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
    setMfaError('');
    setMfaInfo('');

    if (otpType === 'app' || otpType === 'sms' || otpType === 'email') {
      hasTriggered.current = true;
      setMfaInfo('Sending verification code\u2026');
      resendOtp(otpType)
        .then(() => setMfaInfo(''))
        .catch(err => {
          setMfaInfo('');
          setMfaError(extractErrorMessage(err, 'Failed to send verification code.'));
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return; // Allow numeric values only

    const newOtp = [...otpVal];
    // Keep only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtpVal(newOtp);

    // Auto-focus next input box if filled
    if (newOtp[index] !== '' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpVal];
      
      // If current field has content, clear it. Otherwise, clear previous and focus previous
      if (newOtp[index] !== '') {
        newOtp[index] = '';
        setOtpVal(newOtp);
      } else if (index > 0 && inputRefs.current[index - 1]) {
        newOtp[index - 1] = '';
        setOtpVal(newOtp);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted value is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const pasteArray = pastedData.split('');
      setOtpVal(pasteArray);
      setMfaError('');
      
      // Move focus to the last box
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    } else {
      setMfaError('Please paste a valid 6-digit numeric code.');
    }
  };

  const handleResend = async () => {
    if (isRunning) return;
    
    try {
      setMfaError('');
      setMfaInfo('Sending a new code\u2026');
      await resendOtp(otpType);
      setMfaInfo('');
      resetTimer(60); // Reset timer to 60s
    } catch (err) {
      setMfaInfo('');
      setMfaError(extractErrorMessage(err, 'Failed to resend code.'));
    }
  };

  const handleSubmit = async (e) => {
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
          <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-xl mb-4 text-sm flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]" role="status">
            <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin shrink-0" aria-hidden="true"></div>
            <span>{mfaInfo}</span>
          </div>
        )}

        {/* Errors display */}
        {mfaError && (
          <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl mb-5 text-sm flex items-center gap-2 animate-[fadeIn_0.25s_ease-out]" role="alert">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{mfaError}</span>
          </div>
        )}

        {/* 6 Digit Input Group */}
        <div className="flex justify-between gap-2.5 my-6">
          {otpVal.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-black/20 border border-card-border text-text-main outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-black/30 focus:ring-4 focus:ring-primary/20"
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
        <button 
          type="submit" 
          className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 relative overflow-hidden bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mb-5" 
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Code</span>
          )}
        </button>

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

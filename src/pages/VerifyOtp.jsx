import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import AuthLayout from '../layouts/AuthLayout';
import { isValidOrigin, sanitizeRedirectUrl } from '../utils/security';

export default function VerifyOtp() {
  const { verifyOtp, resendOtp, isAuthenticated, error, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 6-digit OTP state array
  const [otpVal, setOtpVal] = useState(new Array(6).fill(''));
  const [mfaError, setMfaError] = useState('');
  
  // Timer countdown: 60 seconds resend cooldown
  const { secondsLeft, isRunning, reset: resetTimer } = useCountdown(60);

  const inputRefs = useRef([]);

  // Flow parameters
  const isPopup = searchParams.get('mode') === 'mode';
  const redirectUri = searchParams.get('redirect_uri');
  const targetOrigin = searchParams.get('origin');

  useEffect(() => {
    clearError();
    setMfaError('');
    // Start resend countdown on load
    resetTimer(60);
    // Autofocus first input box
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [clearError, resetTimer]);

  // Navigate on success
  useEffect(() => {
    if (isAuthenticated) {
      handleSuccessNavigation();
    }
  }, [isAuthenticated]);

  const handleSuccessNavigation = () => {
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
  };

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
      await resendOtp();
      resetTimer(60); // Reset timer to 60s
    } catch (err) {
      setMfaError(err.message || 'Failed to resend code.');
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
      await verifyOtp(fullCode);
      handleSuccessNavigation();
    } catch (err) {
      // Auth context handles main state, but we log mfa issues locally
      setMfaError(err.message || 'OTP Verification failed.');
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="text-xl font-semibold text-center mb-2 text-text-main">
          Verify Your Identity
        </h2>
        <p className="text-[0.85rem] text-center text-text-sub mb-6">
          We sent a verification code to your registered MFA device.
        </p>

        {/* Errors display */}
        {(error || mfaError) && (
          <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl mb-5 text-sm flex items-center gap-2 animate-[fadeIn_0.25s_ease-out]" role="alert">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{mfaError || error}</span>
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

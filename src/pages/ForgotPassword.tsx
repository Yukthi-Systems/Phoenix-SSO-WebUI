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

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Reaptcha from 'react-google-recaptcha';
import AuthLayout from '../layouts/AuthLayout';
import authService from '../services/authService';
import Button from '../components/ui/Button';
import { buttonClasses } from '../components/ui/buttonStyles';
import StatusBanner from '../components/ui/StatusBanner';
import IconCircle from '../components/ui/IconCircle';
import { getBrandName } from '../utils/security';
import toast from 'react-hot-toast';
import type { ApiError } from '../types';

// Tracks the current data-theme attribute so the reCAPTCHA widget matches the active theme.
function useDocumentTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme((document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const recaptchaTheme = useDocumentTheme();

  // Set page title for SEO
  useEffect(() => {
    document.title = `Reset Password | ${getBrandName()}`;
  }, []);

  // Wizard Step: 1 = Request, 2 = Verify OTP & New Password, 3 = Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');

  // Method selection & reCAPTCHA
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<Reaptcha>(null);

  // Form values
  const [email, setEmail] = useState('');
  const [otpVal, setOtpVal] = useState(new Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email submission handler
  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setError('Username/Email is required.');
      return;
    }
    if (!recaptchaToken) {
      setError('Please complete the security verification.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(email, verifyMethod, recaptchaToken);
      toast.success(`Verification code sent to your ${verifyMethod === 'email' ? 'email' : 'phone'}.`);
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      setStep(2);
    } catch (err) {
      setError((err as ApiError).message || 'Failed to send verification code. Please try again.');
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const onRecaptchaVerify = (token: string | null) => {
    setRecaptchaToken(token);
    if (error === 'Please complete the security verification.') setError('');
  };

  const onRecaptchaExpire = () => {
    setRecaptchaToken(null);
    toast.error('Security check expired. Please verify again.');
  };

  const onRecaptchaError = () => {
    setRecaptchaToken(null);
    setError('Security verification failed. Please try again.');
  };

  // Complete Reset handler (OTP + New Password)
  const handleCompleteSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = otpVal.join('');
    if (code.length < 6) {
      setError('Please complete all 6 digits of the verification code.');
      return;
    }
    if (!newPassword) {
      setError('Password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.completePasswordReset(email, code, newPassword, verifyMethod);
      toast.success('Password updated successfully!');
      setStep(3);

      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const msg = (err as ApiError).message || 'Failed to reset password. Please try again.';
      setError(msg);

      // Auto redirect to Step 1 on OTP-related errors to mimic Admin Panel
      if (
        msg.toLowerCase().includes("token") ||
        msg.toLowerCase().includes("otp") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("expired")
      ) {
        setTimeout(() => {
          setStep(1);
          setOtpVal(new Array(6).fill(''));
          setNewPassword('');
          setConfirmPassword('');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    // For resend we don't strictly require recaptcha token in some flows, but to match admin we might need it.
    // If Admin UI doesn't allow simple resend without recaptcha, this might fail unless recaptcha is implemented on Step 2.
    // Assuming backend might allow it or we pass empty.
    try {
      await authService.requestPasswordReset(email, verifyMethod, '');
      toast.success('A new verification code has been sent.');
      setOtpVal(new Array(6).fill(''));
    } catch (err) {
      setError((err as ApiError).message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Password strength checker helper
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-text-muted/30' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-error' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-warning' };
    return { score, label: 'Strong', color: 'bg-success' };
  };

  const strength = getPasswordStrength();

  // Helper to handle OTP entries
  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    const newOtp = [...otpVal];
    newOtp[index] = value.substring(value.length - 1).toUpperCase();
    setOtpVal(newOtp);

    if (newOtp[index] !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpVal];
      if (newOtp[index] !== '') {
        newOtp[index] = '';
        setOtpVal(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtpVal(newOtp);
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/\s/g, '');
    if (!pastedData) return;

    const newOtp = [...otpVal];
    let lastFilledIndex = -1;

    for (let i = 0; i < 6; i++) {
      if (i < pastedData.length) {
        newOtp[i] = pastedData[i];
        lastFilledIndex = i;
      }
    }

    setOtpVal(newOtp);

    // Focus the next input or the last one if full
    const nextIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
    const nextInput = document.getElementById(`otp-input-${nextIndex}`);
    if (nextInput) nextInput.focus();
  };

  return (
    <AuthLayout>
      <div className="flex flex-col relative w-full text-left">
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} noValidate id="forgot-password-email-form">
            <h1 className="text-xl font-semibold mb-2 text-center text-text-main" id="forgot-password-heading">
              Forgot Password
            </h1>
            <p className="text-sm text-center text-text-sub mb-6 leading-relaxed">
              Enter your username and choose a verification method.
            </p>

            {error && (
              <StatusBanner variant="error" className="mb-5" id="email-form-error">
                {error}
              </StatusBanner>
            )}

            <div className="mb-5 flex flex-col relative">
              <label className="text-left text-sm font-medium mb-1.5 text-text-sub" htmlFor="reset-email">
                Username
              </label>
              <input
                id="reset-email"
                type="text"
                className="w-full px-4 py-3 bg-surface-inset-strong border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20"
                placeholder="e.g. username or email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                required
              />
            </div>

            <div className="mb-5 flex flex-col relative">
              <label className="text-left text-sm font-medium mb-2 text-text-sub">
                Verification Method
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${verifyMethod === 'email' ? 'border-primary bg-primary/10 text-primary' : 'border-card-border bg-surface-inset-strong text-text-muted hover:border-primary/50'}`}>
                  <input
                    type="radio"
                    name="verifyMethod"
                    value="email"
                    checked={verifyMethod === 'email'}
                    onChange={() => setVerifyMethod('email')}
                    className="sr-only"
                  />
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <span className="text-sm font-medium">Email</span>
                </label>
                <label className={`flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all ${verifyMethod === 'phone' ? 'border-primary bg-primary/10 text-primary' : 'border-card-border bg-surface-inset-strong text-text-muted hover:border-primary/50'}`}>
                  <input
                    type="radio"
                    name="verifyMethod"
                    value="phone"
                    checked={verifyMethod === 'phone'}
                    onChange={() => setVerifyMethod('phone')}
                    className="sr-only"
                  />
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path></svg>
                  <span className="text-sm font-medium">Phone</span>
                </label>
              </div>
            </div>

            <div className="mb-6 flex justify-center">
              <Reaptcha
                ref={recaptchaRef}
                sitekey="6LdnqnksAAAAADb9pV-s81jk_nEoHP34trkZ457b"
                size="normal"
                onChange={onRecaptchaVerify}
                onExpired={onRecaptchaExpire}
                onErrored={onRecaptchaError}
                theme={recaptchaTheme}
              />
            </div>

            <Button
              id="reset-email-submit-btn"
              type="submit"
              className="mb-4"
              loading={loading}
              loadingText="Sending code..."
            >
              Send Verification Code
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCompleteSubmit} noValidate id="forgot-password-reset-form">
            <h1 className="text-xl font-semibold mb-2 text-center text-text-main">
              Verify Code & Reset Password
            </h1>
            <p className="text-sm text-center text-text-sub mb-6 leading-relaxed">
              We sent a 6-digit recovery code to <strong className="text-text-main">{email}</strong>. Enter it below and create a new password.
            </p>

            {error && (
              <StatusBanner variant="error" className="mb-5" id="password-form-error">
                {error}
              </StatusBanner>
            )}

            <div className="mb-4">
              <label className="text-left text-sm font-medium mb-1.5 text-text-sub block">
                Verification Code
              </label>
              <div className="flex justify-between gap-2.5 mt-2">
                {otpVal.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    className="w-10 h-12 md:w-12 md:h-14 text-center text-xl md:text-2xl font-bold rounded-xl bg-surface-inset-strong border border-card-border text-text-main outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20 uppercase"
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    disabled={loading}
                    aria-label={`Digit ${index + 1}`}
                    required
                  />
                ))}
              </div>
              <div className="text-right mt-2">
                <button
                  type="button"
                  className="text-xs font-medium bg-transparent border-none text-primary hover:text-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleResendCode}
                  disabled={resendLoading || loading}
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </div>

            {/* New Password field */}
            <div className="mb-4 flex flex-col relative mt-6">
              <label className="text-left text-sm font-medium mb-1.5 text-text-sub" htmlFor="reset-new-password">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-surface-inset-strong border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20 pr-11"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 bg-transparent border-none text-text-muted cursor-pointer flex items-center justify-center p-1.5 rounded-full hover:text-text-main transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Strength meter */}
            {newPassword && (
              <div className="mb-4 flex flex-col gap-1.5" id="password-strength-indicator">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Password Strength</span>
                  <span className="font-semibold">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-inset rounded-full overflow-hidden flex gap-0.5">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }}></div>
                </div>
              </div>
            )}

            {/* Confirm Password field */}
            <div className="mb-5 flex flex-col relative">
              <label className="text-left text-sm font-medium mb-1.5 text-text-sub" htmlFor="reset-confirm-password">
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                className="w-full px-4 py-3 bg-surface-inset-strong border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                required
              />
            </div>

            <Button id="reset-password-submit-btn" type="submit" className="mb-4" loading={loading} loadingText="Resetting...">
              Reset Password
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-4 flex flex-col items-center gap-6" id="reset-success-screen">
            <IconCircle variant="success" size="lg">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </IconCircle>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-main mb-2">
                Password Reset Complete
              </h1>
              <p className="text-sm text-text-muted px-4 leading-relaxed">
                Your password has been successfully updated. Redirecting you to the sign in page in a moment...
              </p>
            </div>

            <Link id="success-login-btn" to="/login" className={buttonClasses('primary', 'text-center')}>
              Back to Sign In
            </Link>
          </div>
        )}

        {step !== 3 && (
          <div className="text-center mt-2">
            <Link
              id="back-to-login-link"
              to="/login"
              className="text-sm text-text-sub hover:text-text-main transition-colors font-medium hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import authService from '../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Set page title for SEO
  useEffect(() => {
    document.title = 'Reset Password | SSO Security';
  }, []);

  // Wizard Step: 1 = Request, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form values
  const [email, setEmail] = useState('');
  const [otpVal, setOtpVal] = useState(new Array(6).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email submission handler
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(email);
      toast.success('Verification code sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification handler
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otpVal.join('');
    if (code.length < 6) {
      setError('Please complete all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.verifyPasswordResetOtp(code);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
      setOtpVal(new Array(6).fill(''));
      // Re-focus first OTP input
      setTimeout(() => {
        const firstInput = document.getElementById('otp-input-0');
        if (firstInput) firstInput.focus();
      }, 50);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    try {
      await authService.requestPasswordReset(email);
      toast.success('A new verification code has been sent.');
      setOtpVal(new Array(6).fill(''));
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // New Password submission handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
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
      await authService.confirmPasswordReset(newPassword);
      toast.success('Password updated successfully!');
      setStep(4);

      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please start over.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength checker helper
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-white/10' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  // Helper to handle digit entries
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    const newOtp = [...otpVal];
    newOtp[index] = value.substring(value.length - 1);
    setOtpVal(newOtp);

    if (newOtp[index] !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
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

  return (
    <AuthLayout>
      <div className="flex flex-col relative w-full text-left">
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} noValidate id="forgot-password-email-form">
            <h1 className="text-xl font-semibold mb-2 text-center text-text-main" id="forgot-password-heading">
              Forgot Password
            </h1>
            <p className="text-sm text-center text-text-sub mb-6 leading-relaxed">
              Enter your email address below and we will send you a verification code to reset your password.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-5 text-sm flex items-center gap-2" role="alert" id="email-form-error">
                <span>{error}</span>
              </div>
            )}

            <div className="mb-5 flex flex-col relative">
              <label className="text-left text-sm font-medium mb-1.5 text-text-sub" htmlFor="reset-email">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                className="w-full px-4 py-3 bg-black/20 border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-black/30 focus:ring-4 focus:ring-primary/20"
                placeholder="e.g. name@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                required
              />
            </div>

            <button
              id="reset-email-submit-btn"
              type="submit"
              className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 bg-primary text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
              disabled={loading}
            >
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} noValidate id="forgot-password-otp-form">
            <h1 className="text-xl font-semibold mb-2 text-center text-text-main">
              Verify Code
            </h1>
            <p className="text-sm text-center text-text-sub mb-6 leading-relaxed">
              We sent a 6-digit recovery code to <strong className="text-text-main">{email}</strong>. Please enter it below.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-5 text-sm flex items-center gap-2" role="alert" id="otp-form-error">
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between gap-2.5 my-6">
              {otpVal.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-black/20 border border-card-border text-text-main outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-black/30 focus:ring-4 focus:ring-primary/20"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  disabled={loading}
                  aria-label={`Digit ${index + 1}`}
                  required
                />
              ))}
            </div>

            <button
              id="reset-otp-submit-btn"
              type="submit"
              className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 bg-primary text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
              disabled={loading}
            >
              Verify Code
            </button>

            <button
              id="resend-otp-btn"
              type="button"
              className="w-full py-2.5 px-6 text-sm font-medium rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 bg-transparent border border-card-border text-text-sub hover:text-text-main hover:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleResendCode}
              disabled={resendLoading || loading}
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} noValidate id="forgot-password-reset-form">
            <h1 className="text-xl font-semibold mb-2 text-center text-text-main">
              New Password
            </h1>
            <p className="text-sm text-center text-text-sub mb-6 leading-relaxed">
              Create a new secure password for your Single Sign-On account.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-5 text-sm flex items-center gap-2" role="alert" id="password-form-error">
                <span>{error}</span>
              </div>
            )}

            {/* New Password field */}
            <div className="mb-4 flex flex-col relative">
              <label className="text-left text-sm font-medium mb-1.5 text-text-sub" htmlFor="reset-new-password">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-3 bg-black/20 border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-black/30 focus:ring-4 focus:ring-primary/20 pr-11"
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
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
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
                className="w-full px-4 py-3 bg-black/20 border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-black/30 focus:ring-4 focus:ring-primary/20"
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

            <button
              id="reset-password-submit-btn"
              type="submit"
              className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 bg-primary text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
              disabled={loading}
            >
              Reset Password
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center py-4 flex flex-col items-center gap-6" id="reset-success-screen">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-emerald-500 border border-green-500/20 shadow-[0_0_25px_rgba(34,195,93,0.15)] animate-[pulse_2s_infinite]">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-main mb-2">
                Password Reset Complete
              </h1>
              <p className="text-sm text-text-muted px-4 leading-relaxed">
                Your password has been successfully updated. Redirecting you to the sign in page in a moment...
              </p>
            </div>

            <Link
              id="success-login-btn"
              to="/login"
              className="w-full py-3 px-6 text-base font-semibold rounded-xl text-center transition-all bg-primary text-white shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {step !== 4 && (
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

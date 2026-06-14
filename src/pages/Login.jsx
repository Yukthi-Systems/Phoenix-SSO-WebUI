import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import { isValidOrigin, sanitizeRedirectUrl, getBrandName } from '../utils/security';
import { FORGOT_PASSWORD_URL } from '../const/contants';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, isAuthenticated, error, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Flow control flags
  const isPopup = searchParams.get('mode') === 'popup';
  const redirectUri = searchParams.get('redirect_uri');
  const targetOrigin = searchParams.get('origin');

  useEffect(() => {
    // 1. Immediately check for SEO-Session-ID browser cookie
    const hasSeoSession = document.cookie.split(';').some(item => item.trim().startsWith('SEO-Session-ID='));
    if (hasSeoSession) {
      navigate('/success', { replace: true });
      return;
    }

    // Clear any previous errors on mount
    clearError();
    setValidationError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);



  // Handle automatic redirect if already logged in on page load
  useEffect(() => {
    if (isAuthenticated && !loading) {
      handleSuccessNavigation();
    }
  }, [isAuthenticated, loading]);

  const handleSuccessNavigation = () => {
    if (isPopup) {
      // Validate target origin before posting secret status
      const origin = targetOrigin || (window.opener ? '*' : null);
      if (origin && (origin === '*' || isValidOrigin(origin))) {
        window.opener.postMessage({ type: 'SSO_AUTH_SUCCESS' }, origin);
        // Popup auto-close safely
        window.close();
      } else {
        console.error('Invalid popup postMessage target origin:', origin);
        navigate('/unauthorized');
      }
    } else if (redirectUri) {
      const sanitized = sanitizeRedirectUrl(redirectUri);
      window.location.href = sanitized;
    } else {
      // Standard fallback landing message to the premium success page
      navigate('/success', { replace: true });
    }
  };

  const validateForm = () => {
    if (!email) {
      setValidationError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setValidationError('Password is required.');
      return false;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        // Send state details to the OTP verification page
        const queryParams = new URLSearchParams(searchParams).toString();
        navigate(`/verify-otp?${queryParams}`);
      } else {
        // Set success message from API response
        const messageToShow = typeof result === 'string'
          ? result
          : (result && typeof result.message === 'string' ? result.message : 'Login successful');
        toast.success(messageToShow, { id: 'auth-success' });
        clearError();
        setTimeout(() => {
          handleSuccessNavigation();
        }, 1000);
      }
    } catch (err) {
      // Error handled by AuthContext state
      setValidationError(err?.message)
      console.log('Authentication failed:', err?.message);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="text-xl font-semibold mb-5 text-center text-text-main">
          Sign In
        </h2>

        {/* Email Form Group */}
        <div className="mb-5 flex flex-col relative">
          <label className="text-sm font-medium mb-1.5 text-text-sub transition-colors" htmlFor="email">
            Email Address
          </label>
          <div className="relative flex items-center">
            <input
              id="email"
              type="email"
              className="w-full px-4 py-3 bg-black/20 border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-black/30 focus:ring-4 focus:ring-primary/20"
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) setValidationError('');
                if (error) clearError();
              }}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>
        </div>

        {/* Password Form Group */}
        <div className="mb-5 flex flex-col relative">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-text-sub transition-colors" htmlFor="password">
              Password
            </label>
            <a
              href={FORGOT_PASSWORD_URL}
              className="text-xs text-primary font-medium hover:text-primary-hover hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 bg-black/20 border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-black/30 focus:ring-4 focus:ring-primary/20 pr-11"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationError) setValidationError('');
                if (error) clearError();
              }}
              disabled={loading}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-3 bg-transparent border-none text-text-muted cursor-pointer flex items-center justify-center p-1.5 rounded-full hover:text-text-main transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
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

        {/* Global/API Error Messages */}
        {(error || validationError) && (
          <div className="bg-error/10 border border-error/20 text-error p-3 rounded-xl mb-5 text-sm flex items-center gap-2 animate-[fadeIn_0.25s_ease-out]" role="alert">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Submit Action */}
        <button
          type="submit"
          className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 relative overflow-hidden bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}

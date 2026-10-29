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

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import { isValidOrigin, sanitizeRedirectUrl } from '../utils/security';
import Button from '../components/ui/Button';
import StatusBanner from '../components/ui/StatusBanner';
import Reaptcha from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import type { ApiError } from '../types';
import { RECAPTCHA_SITE_KEY, FORGOT_PASSWORD_URL } from '../const/contants';
import { useDocumentTheme } from '../hooks/useDocumentTheme';

export default function Login() {
  const { login, isAuthenticated, error, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // reCAPTCHA (only rendered when a site key is configured)
  const recaptchaTheme = useDocumentTheme();
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<Reaptcha>(null);

  // The widget only reads `theme` on mount, so it's re-mounted (keyed) on a
  // theme change — which also discards any solved challenge
  const [prevRecaptchaTheme, setPrevRecaptchaTheme] = useState(recaptchaTheme);
  if (recaptchaTheme !== prevRecaptchaTheme) {
    setPrevRecaptchaTheme(recaptchaTheme);
    setRecaptchaToken(null);
  }

  // Flow control flags
  const isPopup = searchParams.get('mode') === 'popup';
  const redirectUri = searchParams.get('redirect_uri');
  const targetOrigin = searchParams.get('origin');

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
      navigate('/authenticated', { replace: true });
    }
  };

  useEffect(() => {
    // 1. Immediately check for SSO-Session-ID browser cookie
    const hasSsoSession = document.cookie.split(';').some(item => item.trim().startsWith('SSO-Session-ID='));
    if (hasSsoSession) {
      navigate('/authenticated', { replace: true });
      return;
    }

    // Clear any previous errors on mount
    clearError();
    // Resetting local UI state on mount, not deriving it from props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValidationError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Handle automatic redirect if already logged in on page load
  useEffect(() => {
    if (isAuthenticated && !loading) {
      handleSuccessNavigation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading]);

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
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setValidationError('Please complete the reCAPTCHA verification.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const result = await login(email, password, false, recaptchaToken || undefined);
      if (result.mfaRequired) {
        const enabledMethods = [];
        if (result.is_app_2fa_enabled) enabledMethods.push('app');
        if (result.is_sms_2fa_enabled) enabledMethods.push('sms');
        if (result.is_email_2fa_enabled) enabledMethods.push('email');

        const queryParams = new URLSearchParams(searchParams);
        if (enabledMethods.length === 1) {
          queryParams.set('mfa_type', enabledMethods[0]);
          navigate(`/verify-otp?${queryParams.toString()}`);
        } else {
          navigate(`/mfa-verification?${queryParams.toString()}`);
        }
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
      // reCAPTCHA tokens are single-use — require a fresh one for the next attempt
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      // Error handled by AuthContext state
      setValidationError((err as ApiError)?.message || '')
      console.log('Authentication failed:', (err as ApiError)?.message);
    }
  };

  const displayedError = validationError || error;
  // Password leak detection: the API rejects credentials found in known breaches
  const isBreachedPassword = !!displayedError && /breached/i.test(displayedError);

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="text-2xl font-bold mb-1.5 text-center text-text-main tracking-tight">
          Welcome back
        </h2>
        <div className="flex justify-center mb-7">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted border border-card-border rounded-full px-3 py-1">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Secure authentication
          </span>
        </div>

        {/* Email Form Group */}
        <div className="mb-5 flex flex-col relative">
          <label className="text-left text-sm font-medium mb-1.5 text-text-sub transition-colors" htmlFor="email">
            Email Address
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-text-muted pointer-events-none" aria-hidden="true">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </span>
            <input
              id="email"
              type="email"
              className="w-full pl-11 pr-4 py-3 bg-surface-inset-strong border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20"
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
            >
              Forgot password?
            </a>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-text-muted pointer-events-none" aria-hidden="true">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full pl-11 pr-11 py-3 bg-surface-inset-strong border border-card-border rounded-xl text-text-main text-base outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20"
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

        {RECAPTCHA_SITE_KEY && (
          <div className="mb-5 flex justify-center">
            <Reaptcha
              key={recaptchaTheme}
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              size="normal"
              onChange={(token) => {
                setRecaptchaToken(token);
                if (token && validationError) setValidationError('');
              }}
              onExpired={() => setRecaptchaToken(null)}
              onErrored={() => setRecaptchaToken(null)}
              theme={recaptchaTheme}
            />
          </div>
        )}

        {/* Global/API Error Messages */}
        {displayedError && (
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
            {displayedError}
            {isBreachedPassword && (
              <>
                {' '}
                <a href={FORGOT_PASSWORD_URL} className="font-semibold underline hover:no-underline">
                  Reset your password
                </a>
              </>
            )}
          </StatusBanner>
        )}

        {/* Submit Action */}
        <Button type="submit" loading={loading} loadingText="Signing in...">
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}

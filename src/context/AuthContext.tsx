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

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAtom } from 'jotai';
import { userAtom, sessionExpirationAtom } from '../store/authStore';
import authService from '../services/authService';
import { getBrandName } from '../utils/security';
import type { AuthContextValue, MfaType, TempMfaData, User, OtpType, ApiError } from '../types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useAtom(userAtom);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaType, setMfaType] = useState<MfaType>(null); // 'email_otp' | 'authenticator_otp'
  const [tempToken, setTempToken] = useState<string | null>(null); // MFA transaction context
  const [tempMfaData, setTempMfaData] = useState<TempMfaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setSessionExpiration] = useAtom(sessionExpirationAtom);


  // Checks for existing session cookie on mount
  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.validateSession();

      const isValid = (data && data.valid) ||
        data === 'Session is valid' ||
        (typeof data === 'string' && data.toLowerCase().includes('valid')) ||
        (data && data.message === 'Session is valid');

      if (isValid) {
        const storedEmail = localStorage.getItem('sso_user_email');
        const storedIsApp2fa = localStorage.getItem('sso_user_is_app_2fa') === 'true';
        const storedIsSms2fa = localStorage.getItem('sso_user_is_sms_2fa') === 'true';
        const storedIsEmail2fa = localStorage.getItem('sso_user_is_email_2fa') === 'true';
        const storedPhone = localStorage.getItem('sso_user_primary_phone');
        const storedSecEmail = localStorage.getItem('sso_user_secondary_email');

        // Map user profile from the top-level response if data.user is not available
        const userProfile: User = data.user || {
          email: data.email || storedEmail || 'user@' + getBrandName(),
          first_name: data.first_name,
          last_name: data.last_name,
          organization_id: data.organization_id,
          organization_name: data.organization_name,
          primary_phone: data.primary_phone !== undefined ? data.primary_phone : (storedPhone || ''),
          secondary_email: data.secondary_email !== undefined ? data.secondary_email : (storedSecEmail || ''),
          is_app_2fa_enabled: data.is_app_2fa_enabled !== undefined ? data.is_app_2fa_enabled : storedIsApp2fa,
          is_sms_2fa_enabled: data.is_sms_2fa_enabled !== undefined ? data.is_sms_2fa_enabled : storedIsSms2fa,
          is_email_2fa_enabled: data.is_email_2fa_enabled !== undefined ? data.is_email_2fa_enabled : storedIsEmail2fa,
        };

        setUser(userProfile);
        if (data.expiration) {
          setSessionExpiration(data.expiration);
        }
        setIsAuthenticated(true);
        setError(null);
        return true;
      }
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } catch {
      console.warn('Session check did not find active session credentials.');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, setSessionExpiration]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Log in using credentials
  const loginAction = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.login(email, password, !!rememberMe);

      // Check if 2FA verification is required
      if (data && data.message === 'OTP verification required') {
        localStorage.setItem('sso_user_email', data.email || email);
        localStorage.setItem('sso_user_is_app_2fa', data.is_app_2fa_enabled ? 'true' : 'false');
        localStorage.setItem('sso_user_is_sms_2fa', data.is_sms_2fa_enabled ? 'true' : 'false');
        localStorage.setItem('sso_user_is_email_2fa', data.is_email_2fa_enabled ? 'true' : 'false');
        localStorage.setItem('sso_user_primary_phone', data.primary_phone || '');
        localStorage.setItem('sso_user_secondary_email', data.secondary_email || '');

        setTempMfaData({
          email: data.email || email,
          first_name: data.first_name,
          last_name: data.last_name,
          primary_phone: data.primary_phone,
          secondary_email: data.secondary_email,
          is_app_2fa_enabled: data.is_app_2fa_enabled,
          is_sms_2fa_enabled: data.is_sms_2fa_enabled,
          is_email_2fa_enabled: data.is_email_2fa_enabled,
          organization_id: data.organization_id,
          organization_name: data.organization_name,
        });
        setMfaPending(true);
        setLoading(false);
        return { mfaRequired: true, ...data };
      }

      if (data.expiration) {
        setSessionExpiration(data.expiration);
      }

      localStorage.setItem('sso_user_email', data.email || email);
      localStorage.setItem('sso_user_is_app_2fa', data.is_app_2fa_enabled ? 'true' : 'false');
      localStorage.setItem('sso_user_is_sms_2fa', data.is_sms_2fa_enabled ? 'true' : 'false');
      localStorage.setItem('sso_user_is_email_2fa', data.is_email_2fa_enabled ? 'true' : 'false');
      localStorage.setItem('sso_user_primary_phone', data.primary_phone || '');
      localStorage.setItem('sso_user_secondary_email', data.secondary_email || '');

      const ok = await checkSession();
      if (!ok) {
        console.warn('Session verification failed after login. Falling back to local state to support local development cookie restrictions.');
        setUser({
          email: data.email || email,
          first_name: data.first_name,
          last_name: data.last_name,
          organization_id: data.organization_id,
          organization_name: data.organization_name,
          primary_phone: data.primary_phone,
          secondary_email: data.secondary_email,
          is_app_2fa_enabled: data.is_app_2fa_enabled,
          is_sms_2fa_enabled: data.is_sms_2fa_enabled,
          is_email_2fa_enabled: data.is_email_2fa_enabled,
        });
        setIsAuthenticated(true);
      } else {
        // Since session check might not return full user info, we can augment it
        // Spreading `prev ?? {}` matches the original's `...prev` (spreading null is a
        // no-op in JS) while satisfying the type checker; cast since prev may lack
        // `email` here exactly like the original untyped object could.
        setUser(prev => ({
          ...(prev ?? {}),
          first_name: prev?.first_name || data.first_name,
          last_name: prev?.last_name || data.last_name,
          organization_id: prev?.organization_id || data.organization_id,
          organization_name: prev?.organization_name || data.organization_name,
          primary_phone: prev?.primary_phone || data.primary_phone,
          secondary_email: prev?.secondary_email || data.secondary_email,
          is_app_2fa_enabled: prev?.is_app_2fa_enabled || data.is_app_2fa_enabled,
          is_sms_2fa_enabled: prev?.is_sms_2fa_enabled || data.is_sms_2fa_enabled,
          is_email_2fa_enabled: prev?.is_email_2fa_enabled || data.is_email_2fa_enabled,
        } as User));
      }

      const message = typeof data === 'string'
        ? data
        : (data && typeof data.message === 'string' ? data.message : 'Login successful');
      return { success: true, message };
    } catch (err) {
      setError((err as ApiError)?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
      throw err;
    }
  };

  // Verifies the OTP (2FA/MFA)
  const verifyOtpAction = useCallback(async (otpType: OtpType, otpCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.validateOtp(otpType, otpCode);

      const ok = await checkSession();
      if (!ok) {
        console.warn('Session check failed after OTP validation. Falling back to local state.');
        if (tempMfaData) {
          setUser({
            email: tempMfaData.email,
            first_name: tempMfaData.first_name,
            last_name: tempMfaData.last_name,
            organization_id: tempMfaData.organization_id,
            organization_name: tempMfaData.organization_name,
            primary_phone: tempMfaData.primary_phone,
            secondary_email: tempMfaData.secondary_email,
            is_app_2fa_enabled: tempMfaData.is_app_2fa_enabled,
            is_sms_2fa_enabled: tempMfaData.is_sms_2fa_enabled,
            is_email_2fa_enabled: tempMfaData.is_email_2fa_enabled,
          });
        }
        setIsAuthenticated(true);
      }
      setMfaPending(false);
      setTempMfaData(null);
      return { success: true, message: response.message || 'OTP validated successfully' };
    } catch (err) {
      setError((err as ApiError)?.message || 'OTP Verification failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [checkSession, setUser, tempMfaData]);

  // Resend OTP code
  const resendOtpAction = useCallback(async (otpType: OtpType) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.resendOtp(otpType);
      return { success: true, message: response.message || 'OTP resent successfully' };
    } catch (err) {
      setError((err as ApiError)?.message || 'Failed to resend code.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Log out action - resets state and forces clean reload
  const logoutAction = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout endpoint did not respond cleanly:', err);
    } finally {
      // Clear client state
      setUser(null);
      setIsAuthenticated(false);
      setMfaPending(false);
      setMfaType(null);
      setTempToken(null);

      // Clear entire local storage
      localStorage.clear();

      // Clear all client-accessible cookies comprehensively
      const cookies = document.cookie.split(";");
      const domain = window.location.hostname;

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

        // Attempt to clear at root path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        // Attempt to clear on exact domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
        // Attempt to clear on parent domain (e.g., .example.com)
        const domainParts = domain.split('.');
        if (domainParts.length >= 2) {
          const rootDomain = `.${domainParts.slice(-2).join('.')}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${rootDomain}`;
        }
      }


      // Crucial: Clear session details in context, redirect to login
      window.location.href = '/login';
    }
  };

  // Activity tracking hook to notify the backend about user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastUpdated = 0;
    const throttleInterval = 60 * 1000; // 1 minute throttle

    const updateActivity = async () => {
      const now = Date.now();
      if (now - lastUpdated > throttleInterval) {
        lastUpdated = now;
        try {
          await authService.updateLastActive();
        } catch (err) {
          console.warn('Failed to update session last-active status:', err);
        }
      }
    };

    // Listen to common user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    // Also trigger immediately on mount/authenticated
    updateActivity();

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
    };
  }, [isAuthenticated]);

  const clearError = () => setError(null);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    mfaPending,
    mfaType,
    tempToken,
    tempMfaData,
    setTempMfaData,
    loading,
    error,
    login: loginAction,
    verifyOtp: verifyOtpAction,
    resendOtp: resendOtpAction,
    logout: logoutAction,
    checkSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';
import { getBrandName } from '../utils/security';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaType, setMfaType] = useState(null); // 'email_otp' | 'authenticator_otp'
  const [tempToken, setTempToken] = useState(null); // MFA transaction context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const rotationIntervalRef = useRef(null);
  const isRotatingRef = useRef(false);

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
        
        // Map user profile from the top-level response if data.user is not available
        const userProfile = data.user || {
          email: data.email || storedEmail || 'user@' + getBrandName(),
          first_name: data.first_name,
          last_name: data.last_name,
          organization_id: data.organization_id,
          organization_name: data.organization_name
        };

        setUser(userProfile);
        setIsAuthenticated(true);
        setError(null);
        return true;
      }
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } catch (err) {
      console.warn('Session check did not find active session credentials.');
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Log in using credentials
  const loginAction = async (email, password, rememberMe) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.login(email, password, rememberMe);

      const requiresMfa = data.requiresMfa || data.is_app_2fa_enabled || data.is_email_2fa_enabled || data.is_sms_2fa_enabled;

      if (requiresMfa) {
        setMfaPending(true);
        let type = data.mfaType || 'email_otp';
        if (!data.mfaType) {
          if (data.is_app_2fa_enabled) type = 'authenticator_otp';
          else if (data.is_sms_2fa_enabled) type = 'sms_otp';
          else if (data.is_email_2fa_enabled) type = 'email_otp';
        }
        setMfaType(type);
        setTempToken(data.tempToken || null);
        setLoading(false);
        localStorage.setItem('sso_user_email', email);
        return { mfaRequired: true, mfaType: type };
      }

      // If no MFA is required, we validate session to fetch user profile
      localStorage.setItem('sso_user_email', email);
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
          secondary_email: data.secondary_email
        });
        setIsAuthenticated(true);
      } else {
        // Since session check might not return full user info, we can augment it
        setUser(prev => ({
          ...prev,
          first_name: prev?.first_name || data.first_name,
          last_name: prev?.last_name || data.last_name,
          organization_id: prev?.organization_id || data.organization_id,
          organization_name: prev?.organization_name || data.organization_name,
          primary_phone: prev?.primary_phone || data.primary_phone,
          secondary_email: prev?.secondary_email || data.secondary_email
        }));
      }
      
      const message = typeof data === 'string' 
        ? data 
        : (data && typeof data.message === 'string' ? data.message : 'Login successful');
      return { success: true, message };
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
      throw err;
    }
  };

  // Verifies the OTP (2FA/MFA)
  const verifyOtpAction = async (otpCode) => {
    try {
      setLoading(true);
      setError(null);
      await authService.verifyOtp(otpCode, tempToken);

      // OTP verified successfully, load active session
      const ok = await checkSession();
      if (!ok) {
        throw new Error('OTP verified but session validation failed.');
      }

      // Clear MFA transient state
      setMfaPending(false);
      setMfaType(null);
      setTempToken(null);
      return { success: true };
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
      setLoading(false);
      throw err;
    }
  };

  // Resend OTP code
  const resendOtpAction = async () => {
    try {
      setError(null);
      await authService.resendOtp(tempToken);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
      throw err;
    }
  };

  // Perform rotation on a background interval (e.g. every 4 minutes)
  const rotateSessionAction = useCallback(async () => {
    if (isRotatingRef.current) return;
    isRotatingRef.current = true;

    try {
      await authService.rotateSession();
      console.log('Background session cookies rotated successfully.');
    } catch (err) {
      console.error('Failed background session rotation:', err);
      // If 401 occurs during rotation, session expired
      if (err.code === 'SESSION_EXPIRED') {
        setIsAuthenticated(false);
        setUser(null);
        // Force session expired page redirect
        window.location.href = '/session-expired';
      }
    } finally {
      isRotatingRef.current = false;
    }
  }, []);

  // Sets up rotation intervals when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Rotate every 4 minutes (240000 ms) to keep cookie active
      rotationIntervalRef.current = setInterval(rotateSessionAction, 240000);
    } else {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }
    }

    return () => {
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
    };
  }, [isAuthenticated, rotateSessionAction]);

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

      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
        rotationIntervalRef.current = null;
      }

      // Crucial: Clear session details in context, redirect to login
      window.location.href = '/login';
    }
  };
  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    isAuthenticated,
    mfaPending,
    mfaType,
    tempToken,
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

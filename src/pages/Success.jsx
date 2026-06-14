import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import { maskEmail, getBrandName } from '../utils/security';

export default function Success() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed:', err.message);
    }
  };

  const displayEmail = user && user.email ? maskEmail(user.email) : 'your-account@' + getBrandName();

  return (
    <AuthLayout>
      <div className="text-center py-4 flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Animated Checkmark Circle */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success border border-success/20 shadow-[0_0_25px_rgba(34,195,93,0.15)] animate-[pulse_2s_infinite]">
          <svg 
            width="32" 
            height="32" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            viewBox="0 0 24 24" 
            aria-hidden="true"
            className="animate-[scaleIn_0.25s_cubic-bezier(0.175,0.885,0.32,1.275)]"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Header and Details */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight text-text-main">
            Authentication Successful
          </h2>
          <p className="text-sm text-text-muted px-4 leading-relaxed">
            Your Single Sign-On session is verified and securely established.
          </p>
        </div>

        {/* User Information Card */}
        <div className="w-full p-4 bg-black/15 border border-card-border rounded-xl text-left flex flex-col gap-4 transition-all duration-300 hover:border-white/10">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Authenticated As
            </span>
            <span className="text-base font-medium text-text-sub truncate">
              {displayEmail}
            </span>
          </div>

          {((user && user.first_name) || (user && user.last_name)) && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Name
              </span>
              <span className="text-sm font-medium text-text-sub truncate">
                {[user?.first_name, user?.last_name].filter(Boolean).join(' ')}
              </span>
            </div>
          )}

          {user && user.organization_name && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Organization
              </span>
              <span className="text-sm font-medium text-text-sub truncate">
                {user.organization_name}
              </span>
            </div>
          )}

          {user && user.primary_phone && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Phone
              </span>
              <span className="text-sm font-medium text-text-sub truncate">
                {user.primary_phone}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 relative overflow-hidden bg-white/5 border border-card-border hover:bg-white/10 text-text-sub hover:text-text-main focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </>
          )}
        </button>

      </div>
    </AuthLayout>
  );
}

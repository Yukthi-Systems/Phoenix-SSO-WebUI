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

import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import { maskEmail, getBrandName } from '../utils/security';
import type { ApiError } from '../types';

export default function Success() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed:', (err as ApiError).message);
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

        {/* Dashboard Grid Container */}
        <div className="w-full flex flex-col gap-5 text-left">

          {/* Section 1: Account Profile */}
          <div className="p-5 bg-black/20 border border-card-border rounded-2xl flex flex-col gap-4 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              SSO Account Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Email Address</span>
                <span className="text-sm font-medium text-text-main truncate">{displayEmail}</span>
              </div>

              {((user && user.first_name) || (user && user.last_name)) && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Display Name</span>
                  <span className="text-sm font-medium text-text-main truncate">
                    {[user?.first_name, user?.last_name].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}

              {user && user.organization_name && (
                <div className="flex flex-col gap-1 col-span-1 md:col-span-2 border-t border-card-border/50 pt-3">
                  <span className="text-xs text-text-muted">Managed Organization</span>
                  <span className="text-sm font-medium text-text-main truncate">{user.organization_name}</span>
                </div>
              )}

              {user && user.primary_phone && (
                <div className="flex flex-col gap-1 border-t border-card-border/50 pt-3">
                  <span className="text-xs text-text-muted">Primary Phone</span>
                  <span className="text-sm font-medium text-text-main truncate">{user.primary_phone}</span>
                </div>
              )}

              {user && user.secondary_email && (
                <div className="flex flex-col gap-1 border-t border-card-border/50 pt-3">
                  <span className="text-xs text-text-muted">Secondary Email</span>
                  <span className="text-sm font-medium text-text-main truncate">{user.secondary_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Security & MFA Settings */}
          <div className="p-5 bg-black/20 border border-card-border rounded-2xl flex flex-col gap-4 transition-all duration-300 hover:border-accent/20 hover:shadow-[0_4px_20px_rgba(170,59,255,0.05)]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Multi-Factor Authentication
            </h3>

            <div className="flex flex-col gap-3">
              {/* Authenticator App */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-card-border/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-text-sub">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-main">Authenticator App</div>
                    <div className="text-xs text-text-muted">TOTP verification code</div>
                  </div>
                </div>
                {user && user.is_app_2fa_enabled ? (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/5 text-text-muted border border-card-border/50">
                    Inactive
                  </span>
                )}
              </div>

              {/* SMS OTP */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-card-border/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-text-sub">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-main">SMS Verification</div>
                    <div className="text-xs text-text-muted">Secure SMS code</div>
                  </div>
                </div>
                {user && user.is_sms_2fa_enabled ? (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/5 text-text-muted border border-card-border/50">
                    Inactive
                  </span>
                )}
              </div>

              {/* Email OTP */}
              <div className="flex items-center justify-between p-3 bg-white/5 border border-card-border/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="text-text-sub">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-main">Email Verification</div>
                    <div className="text-xs text-text-muted">Backup email code</div>
                  </div>
                </div>
                {user && user.is_email_2fa_enabled ? (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/5 text-text-muted border border-card-border/50">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

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

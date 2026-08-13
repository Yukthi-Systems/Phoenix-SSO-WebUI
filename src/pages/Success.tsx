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

import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import { getBrandName } from '../utils/security';
import Button from '../components/ui/Button';
import IconCircle from '../components/ui/IconCircle';
import StatusPill from '../components/ui/StatusPill';
import type { ApiError } from '../types';

type ChipTone = 'success' | 'primary' | 'neutral';

const chipToneClasses: Record<ChipTone, string> = {
  success: 'bg-success/10 text-success border-success/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  neutral: 'bg-card text-text-muted border-card-border',
};

function StatusChip({ icon, label, tone }: { icon: ReactNode; label: string; tone: ChipTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${chipToneClasses[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

export default function Success() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed:', (err as ApiError).message);
    }
  };

  const displayEmail = user && user.email ? user.email : 'your-account@' + getBrandName();
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const mfaEnabled = !!(user && (user.is_app_2fa_enabled || user.is_sms_2fa_enabled || user.is_email_2fa_enabled));

  return (
    <AuthLayout>
      <div className="text-center flex flex-col items-center gap-5 animate-[fadeIn_0.3s_ease-out]">

        {/* Checkmark Circle */}
        <IconCircle variant="success" size="md">
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </IconCircle>

        {/* Personalized greeting */}
        <div className="flex flex-col gap-1.5 -mt-1">
          <h2 className="text-xl font-bold tracking-tight text-text-main">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
          </h2>
          <p className="text-sm text-text-muted px-4 leading-relaxed">
            Your session is verified and securely established.
          </p>
        </div>

        {/* Status summary */}
        <div className="flex flex-wrap justify-center gap-2">
          <StatusChip
            tone="success"
            icon={
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            }
            label="Identity Verified"
          />
          <StatusChip
            tone={mfaEnabled ? 'success' : 'neutral'}
            icon={
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            }
            label={mfaEnabled ? 'MFA Active' : 'MFA Not Enabled'}
          />
          <StatusChip
            tone="primary"
            icon={
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
            }
            label="Session Active"
          />
        </div>

        {/* Collapsible account details */}
        <details className="w-full text-left group">
          <summary className="cursor-pointer list-none flex items-center justify-center gap-1.5 text-sm font-medium text-text-sub hover:text-text-main transition-colors py-1 select-none">
            <span>View account details</span>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="transition-transform duration-200 group-open:rotate-180"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </summary>

          <div className="flex flex-col gap-4 mt-4">
            {/* Account Profile */}
            <div className="px-4 bg-surface-inset border border-card-border rounded-2xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2 pt-3.5 pb-1">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Account Profile
              </h3>

              <dl className="divide-y divide-card-border/60">
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-xs text-text-muted shrink-0">Email</dt>
                  <dd className="text-sm font-medium text-text-main truncate text-right">{displayEmail}</dd>
                </div>

                {displayName && (
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-xs text-text-muted shrink-0">Name</dt>
                    <dd className="text-sm font-medium text-text-main truncate text-right">{displayName}</dd>
                  </div>
                )}

                {user && user.organization_name && (
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-xs text-text-muted shrink-0">Organization</dt>
                    <dd className="text-sm font-medium text-text-main truncate text-right">{user.organization_name}</dd>
                  </div>
                )}

                {user && user.primary_phone && (
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-xs text-text-muted shrink-0">Phone</dt>
                    <dd className="text-sm font-medium text-text-main truncate text-right">{user.primary_phone}</dd>
                  </div>
                )}

                {user && user.secondary_email && (
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-xs text-text-muted shrink-0">Secondary Email</dt>
                    <dd className="text-sm font-medium text-text-main truncate text-right">{user.secondary_email}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Security & MFA Settings */}
            <div className="px-4 bg-surface-inset border border-card-border rounded-2xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-2 pt-3.5 pb-1">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Multi-Factor Authentication
              </h3>

              <div className="divide-y divide-card-border/60">
                {/* Authenticator App */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-text-sub shrink-0">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-main truncate">Authenticator App</span>
                  </div>
                  <StatusPill active={!!(user && user.is_app_2fa_enabled)} />
                </div>

                {/* SMS OTP */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-text-sub shrink-0">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-main truncate">SMS Verification</span>
                  </div>
                  <StatusPill active={!!(user && user.is_sms_2fa_enabled)} />
                </div>

                {/* Email OTP */}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-text-sub shrink-0">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-text-main truncate">Email Verification</span>
                  </div>
                  <StatusPill active={!!(user && user.is_email_2fa_enabled)} />
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* Action Button */}
        <Button variant="secondary" onClick={handleLogout} loading={loading} loadingText="Signing out...">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </Button>

      </div>
    </AuthLayout>
  );
}

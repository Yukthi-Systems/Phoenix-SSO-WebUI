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

import { useState, useEffect, useCallback, type ReactNode, type FormEvent } from 'react';
import { useSetAtom } from 'jotai';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { userAtom } from '../store/authStore';
import authService from '../services/authService';
import AuthLayout from '../layouts/AuthLayout';
import { getBrandName } from '../utils/security';
import Button from '../components/ui/Button';
import IconCircle from '../components/ui/IconCircle';
import StatusPill from '../components/ui/StatusPill';
import StatusBanner from '../components/ui/StatusBanner';
import Modal from '../components/ui/Modal';
import type { ApiError, BasicUserInfo, User } from '../types';

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

const inputClasses =
  'w-full px-3 py-2.5 bg-surface-inset-strong border border-card-border rounded-lg text-text-main text-base sm:text-sm outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20 disabled:opacity-60';

const smallButtonClasses =
  'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-card-border text-text-sub hover:text-text-main hover:bg-white/5 transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-xs text-text-muted shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-text-main truncate text-right">{value}</dd>
    </div>
  );
}

export default function Success() {
  const { user, logout, loading } = useAuth();
  const setUser = useSetAtom(userAtom);

  // Fresh profile from GET /user/my-info (the session payload can be stale)
  const [profile, setProfile] = useState<BasicUserInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', secondary_email: '' });

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const info = await authService.getMyInfo();
      setProfile(info);
      // Keep the persisted session profile in sync so the rest of the UI isn't stale
      setUser(prev => ({
        ...(prev ?? {}),
        email: info.email,
        first_name: info.first_name,
        last_name: info.last_name ?? undefined,
        primary_phone: info.primary_phone,
        secondary_email: info.secondary_email ?? undefined,
        is_app_2fa_enabled: info.is_app_2fa_enabled,
        is_sms_2fa_enabled: info.is_sms_2fa_enabled,
        is_email_2fa_enabled: info.is_email_2fa_enabled,
      } as User));
    } catch (err) {
      setProfileError((err as ApiError)?.message || 'Unable to load your profile.');
    } finally {
      setProfileLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    // Fetch on mount; fetchProfile manages its own loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const startEditing = () => {
    setForm({
      first_name: profile?.first_name ?? user?.first_name ?? '',
      last_name: profile?.last_name ?? user?.last_name ?? '',
      secondary_email: profile?.secondary_email ?? user?.secondary_email ?? '',
    });
    setFormError('');
    setEditing(true);
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const secondaryEmail = form.secondary_email.trim();

    if (!firstName) {
      setFormError('First name is required.');
      return;
    }
    if (secondaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(secondaryEmail)) {
      setFormError('Please enter a valid secondary email address.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      // The API overwrites all three fields, so always send the full set
      const result = await authService.updateMyInfo({
        first_name: firstName,
        last_name: lastName || null,
        secondary_email: secondaryEmail || null,
      });
      toast.success(typeof result === 'string' ? result : (result?.message || 'Profile updated'), { id: 'profile-updated' });
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      setFormError((err as ApiError)?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout failed:', (err as ApiError).message);
    }
  };

  // Prefer the freshly fetched profile; fall back to the session payload
  const firstName = profile?.first_name ?? user?.first_name;
  const displayEmail = profile?.email || user?.email || 'your-account@' + getBrandName();
  const displayName = [firstName, profile ? profile.last_name : user?.last_name].filter(Boolean).join(' ');
  const primaryPhone = profile?.primary_phone ?? user?.primary_phone;
  const secondaryEmail = profile ? profile.secondary_email : user?.secondary_email;
  const isApp2fa = profile?.is_app_2fa_enabled ?? user?.is_app_2fa_enabled;
  const isSms2fa = profile?.is_sms_2fa_enabled ?? user?.is_sms_2fa_enabled;
  const isEmail2fa = profile?.is_email_2fa_enabled ?? user?.is_email_2fa_enabled;
  const mfaEnabled = !!(isApp2fa || isSms2fa || isEmail2fa);

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
            Welcome back{firstName ? `, ${firstName}` : ''}
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
            {profileError && (
              <StatusBanner variant="error">
                {profileError}
              </StatusBanner>
            )}

            {/* Account Profile */}
            <div className="px-4 bg-surface-inset border border-card-border rounded-2xl">
              <div className="flex items-center justify-between gap-2 pt-3 pb-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Account Profile
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className={smallButtonClasses}
                    onClick={fetchProfile}
                    disabled={profileLoading}
                    aria-label="Refresh profile"
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className={profileLoading ? 'animate-spin' : ''}
                    >
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Refresh
                  </button>
                  <button
                    type="button"
                    className={smallButtonClasses}
                    onClick={startEditing}
                    disabled={profileLoading && !profile}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Edit
                  </button>
                </div>
              </div>

              <dl className="divide-y divide-card-border/60" aria-busy={profileLoading}>
                <DetailRow label="Email" value={displayEmail} />
                {displayName && <DetailRow label="Name" value={displayName} />}
                {profile?.employee_id && <DetailRow label="Employee ID" value={profile.employee_id} />}
                {user?.organization_name && <DetailRow label="Organization" value={user.organization_name} />}
                {profile?.domain_name && <DetailRow label="Domain" value={profile.domain_name} />}
                {primaryPhone && <DetailRow label="Phone" value={primaryPhone} />}
                {secondaryEmail && <DetailRow label="Secondary Email" value={secondaryEmail} />}
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
                  <StatusPill active={!!isApp2fa} />
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
                  <StatusPill active={!!isSms2fa} />
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
                  <StatusPill active={!!isEmail2fa} />
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

      <Modal
        open={editing}
        onClose={() => { if (!saving) setEditing(false); }}
        title="Edit profile"
        description="Update your name and secondary email address."
      >
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-first-name" className="text-sm font-medium text-text-sub">First name</label>
              <input
                id="profile-first-name"
                className={inputClasses}
                value={form.first_name}
                onChange={(e) => { setForm(f => ({ ...f, first_name: e.target.value })); setFormError(''); }}
                disabled={saving}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-last-name" className="text-sm font-medium text-text-sub">Last name</label>
              <input
                id="profile-last-name"
                className={inputClasses}
                value={form.last_name}
                onChange={(e) => { setForm(f => ({ ...f, last_name: e.target.value })); setFormError(''); }}
                disabled={saving}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-secondary-email" className="text-sm font-medium text-text-sub">Secondary email</label>
            <input
              id="profile-secondary-email"
              type="email"
              className={inputClasses}
              value={form.secondary_email}
              onChange={(e) => { setForm(f => ({ ...f, secondary_email: e.target.value })); setFormError(''); }}
              disabled={saving}
              autoComplete="email"
              placeholder="Optional"
            />
          </div>

          {formError && (
            <StatusBanner variant="error">{formError}</StatusBanner>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className={smallButtonClasses}
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving && (
                <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" aria-hidden="true" />
              )}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  );
}

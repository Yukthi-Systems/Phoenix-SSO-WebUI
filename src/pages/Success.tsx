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

import { useState, useEffect, useCallback, useId, type ReactNode, type FormEvent } from 'react';
import { useSetAtom } from 'jotai';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { userAtom } from '../store/authStore';
import authService from '../services/authService';
import AuthLayout from '../layouts/AuthLayout';
import { getBrandName } from '../utils/security';
import { FORGOT_PASSWORD_URL } from '../const/contants';
import Button from '../components/ui/Button';
import StatusPill from '../components/ui/StatusPill';
import StatusBanner from '../components/ui/StatusBanner';
import Modal from '../components/ui/Modal';
import type { ApiError, BasicUserInfo, User } from '../types';

const inputClasses =
  'w-full px-3 py-2.5 bg-surface-inset-strong border border-card-border rounded-lg text-text-main text-base sm:text-sm outline-none transition-all placeholder-text-muted focus:border-primary focus:bg-surface-inset-focus focus:ring-4 focus:ring-primary/20 disabled:opacity-60';

const smallButtonClasses =
  'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md text-text-sub hover:text-text-main hover:bg-surface-inset-strong transition-colors cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed';

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="pt-3 border-t border-card-border">
      <div className="flex items-center justify-between gap-2 min-h-7">
        <h3 id={headingId} className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// `value === undefined` while loading renders a placeholder bar; empty values read "Not added"
function DetailRow({ label, value, loading }: { label: string; value: string | null | undefined; loading?: boolean }) {
  let content: ReactNode;
  if (value) {
    content = <span className="text-text-main" title={value}>{value}</span>;
  } else if (loading && value === undefined) {
    content = <span className="inline-block h-3.5 w-24 align-middle rounded bg-surface-inset-strong animate-pulse" aria-hidden="true" />;
  } else {
    content = <span className="text-text-muted">Not added</span>;
  }

  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt className="text-sm text-text-sub shrink-0">{label}</dt>
      <dd className="text-sm font-medium truncate text-right min-w-0">{content}</dd>
    </div>
  );
}

function SecurityRow({ icon, label, enabled }: { icon: ReactNode; label: string; enabled: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-2.5 min-w-0 text-sm text-text-main">
        <span className="text-text-muted shrink-0" aria-hidden="true">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      <StatusPill active={enabled} activeLabel="Enabled" inactiveLabel="Off" />
    </li>
  );
}

function getInitials(name: string, email: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length > 0) {
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

export default function Success() {
  const { user, logout, loading } = useAuth();
  const setUser = useSetAtom(userAtom);

  // Fresh profile from GET /user/my-info (the session payload can be stale)
  const [profile, setProfile] = useState<BasicUserInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Edit profile modal
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

  const closeEditing = () => {
    if (saving) return;
    setEditing(false);
    setFormError('');
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
  const showSkeleton = profileLoading && !profile;

  return (
    <AuthLayout>
      <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out]">

        {/* Identity */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-base font-semibold"
            aria-hidden="true"
          >
            {getInitials(displayName, displayEmail)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-text-main truncate" title={displayName || displayEmail}>
              {displayName || displayEmail}
            </h2>
            {displayName && (
              <p className="text-sm text-text-muted truncate" title={displayEmail}>{displayEmail}</p>
            )}
            <p role="status" className="mt-1 flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" aria-hidden="true" />
              Signed in · Session active
            </p>
          </div>
        </div>

        {profileError && (
          <StatusBanner variant="error">{profileError}</StatusBanner>
        )}

        {/* Account details */}
        <Section
          title="Account"
          action={
            <div className="flex items-center gap-0.5 -mr-2">
              <button
                type="button"
                className={smallButtonClasses}
                onClick={fetchProfile}
                disabled={profileLoading}
                aria-label="Refresh account details"
                title="Refresh"
              >
                <svg
                  width="13"
                  height="13"
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
              </button>
              <button
                type="button"
                className={smallButtonClasses}
                onClick={startEditing}
                disabled={showSkeleton}
              >
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                Edit
              </button>
            </div>
          }
        >
          <dl className="divide-y divide-card-border" aria-busy={profileLoading}>
            {user?.organization_name && <DetailRow label="Organization" value={user.organization_name} />}
            <DetailRow label="Domain" value={profile?.domain_name ?? (showSkeleton ? undefined : displayEmail.split('@')[1])} loading={showSkeleton} />
            {profile?.employee_id && <DetailRow label="Employee ID" value={profile.employee_id} />}
            <DetailRow label="Phone" value={primaryPhone} loading={showSkeleton} />
            <DetailRow label="Secondary email" value={secondaryEmail} loading={showSkeleton} />
          </dl>
        </Section>

        {/* Multi-factor authentication */}
        <Section title="Sign-in security">
          <ul className="divide-y divide-card-border">
            {/* Password changes go through the same reset flow as "Forgot password" */}
            <li className="flex items-center justify-between gap-3 py-1.5">
              <span className="flex items-center gap-2.5 min-w-0 text-sm text-text-main">
                <span className="text-text-muted shrink-0" aria-hidden="true">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                  </svg>
                </span>
                <span className="truncate">Password</span>
              </span>
              <a
                href={FORGOT_PASSWORD_URL}
                className="text-xs font-semibold text-primary px-2 py-1 -mr-2 rounded-md hover:text-primary-hover hover:bg-surface-inset-strong transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                Change password
              </a>
            </li>
            <SecurityRow
              label="Authenticator app"
              enabled={!!isApp2fa}
              icon={
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              }
            />
            <SecurityRow
              label="SMS verification"
              enabled={!!isSms2fa}
              icon={
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              }
            />
            <SecurityRow
              label="Email verification"
              enabled={!!isEmail2fa}
              icon={
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              }
            />
          </ul>
        </Section>

        <Button variant="secondary" onClick={handleLogout} loading={loading} loadingText="Signing out...">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign out</span>
        </Button>

      </div>

      <Modal
        open={editing}
        onClose={closeEditing}
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
              className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-lg border border-card-border text-text-sub hover:text-text-main hover:bg-surface-inset-strong transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={closeEditing}
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

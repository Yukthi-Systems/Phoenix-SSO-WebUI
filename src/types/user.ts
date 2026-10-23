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

export interface User {
  email: string;
  first_name?: string;
  last_name?: string;
  organization_id?: string;
  organization_name?: string;
  primary_phone?: string;
  secondary_email?: string;
  is_app_2fa_enabled?: boolean;
  is_sms_2fa_enabled?: boolean;
  is_email_2fa_enabled?: boolean;
}

// MFA transaction data carries the same profile fields as User, gathered
// before a session is fully established.
export type TempMfaData = User;

// GET /user/my-info — fetched from the DB, bypassing the session cache.
export interface BasicUserInfo {
  email: string;
  domain_name: string;
  first_name: string;
  last_name: string | null;
  employee_id: string | null;
  primary_phone: string;
  secondary_email: string | null;
  is_app_2fa_enabled: boolean;
  is_sms_2fa_enabled: boolean;
  is_email_2fa_enabled: boolean;
}

// PUT /user/my-info payload
export interface EditUserInfo {
  first_name: string;
  last_name: string | null;
  secondary_email: string | null;
}

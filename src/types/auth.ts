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

import type { Dispatch, SetStateAction } from 'react';
import type { User, TempMfaData } from './user';

export type MfaType = 'email_otp' | 'authenticator_otp' | null;

export type OtpType = 'app' | 'sms' | 'email';

// Backend response shapes are loosely documented (see authService JSDoc),
// so these results are typed by the fields callers actually branch on,
// with an index signature for the rest of the passthrough payload.
export interface LoginActionResult {
  success?: boolean;
  mfaRequired?: boolean;
  message: string;
  [key: string]: unknown;
}

export interface OtpActionResult {
  success: boolean;
  message: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  mfaPending: boolean;
  mfaType: MfaType;
  tempToken: string | null;
  tempMfaData: TempMfaData | null;
  setTempMfaData: Dispatch<SetStateAction<TempMfaData | null>>;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginActionResult>;
  verifyOtp: (otpType: OtpType, otpCode: string) => Promise<OtpActionResult>;
  resendOtp: (otpType: OtpType) => Promise<OtpActionResult>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  clearError: () => void;
}

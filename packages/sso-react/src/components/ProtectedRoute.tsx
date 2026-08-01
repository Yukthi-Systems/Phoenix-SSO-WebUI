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
import { useSSOAuth } from '../useSSOAuth';

export interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Rendered when the user is not authenticated. Deliberately not a redirect
   * path — this package doesn't assume any particular router. Pass your own
   * router's redirect element here, e.g. `<Navigate to="/login" replace />`.
   */
  fallback: ReactNode;
  /** Rendered while the initial session check is in flight. Default: null. */
  loading?: ReactNode;
}

/** Gates its children behind SSO authentication status. */
export function ProtectedRoute({ children, fallback, loading = null }: ProtectedRouteProps) {
  const { status } = useSSOAuth();

  if (status === 'checking') return <>{loading}</>;
  if (status !== 'authenticated') return <>{fallback}</>;
  return <>{children}</>;
}

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

import AuthLayout from '../layouts/AuthLayout';
import { getBrandName } from '../utils/security';
import IconCircle from '../components/ui/IconCircle';

export default function Unauthorized() {
  return (
    <AuthLayout>
      <div className="text-center">
        {/* Shield/Alert icon */}
        <div className="mb-5">
          <IconCircle variant="error">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </IconCircle>
        </div>

        <h2 className="text-xl font-semibold mb-2 text-text-main">
          Access Denied
        </h2>
        <p className="text-[0.875rem] text-text-sub mb-6">
          The application requesting authentication is not authorized to interact with this SSO provider, or the redirect coordinates are invalid.
        </p>

        <div className="bg-black/10 border border-card-border rounded-lg p-3 text-xs text-text-muted text-left mb-5">
          <strong>Security Notice:</strong> To register a new application domain or update your whitelist configuration, please contact the network administrator for <em>{getBrandName()}</em>.
        </div>
      </div>
    </AuthLayout>
  );
}

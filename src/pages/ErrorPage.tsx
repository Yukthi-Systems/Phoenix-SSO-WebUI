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

import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { getBrandName } from '../utils/security';
import Button from '../components/ui/Button';
import { buttonClasses } from '../components/ui/buttonStyles';
import IconCircle from '../components/ui/IconCircle';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="text-center">
        {/* Error icon wrapper */}
        <div className="mb-5">
          <IconCircle variant="error">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </IconCircle>
        </div>

        <h2 className="text-xl font-semibold mb-2 text-text-main">
          Authentication Error
        </h2>
        <p className="text-[0.875rem] text-text-sub mb-6">
          An unexpected authentication error occurred. Please verify your connection and try again.
        </p>

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={() => navigate('/login')}>
            Return to Login
          </Button>

          <a
            href={`https://support.${getBrandName()}`}
            className={`${buttonClasses('secondary')} no-underline`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Support
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

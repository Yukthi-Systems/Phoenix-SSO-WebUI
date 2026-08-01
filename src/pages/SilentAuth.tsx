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

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { isValidOrigin } from '../utils/security';
import type { ApiError } from '../types';

export default function SilentAuth() {
  const [searchParams] = useSearchParams();

  const app = searchParams.get('app');
  const targetOrigin = searchParams.get('origin');

  useEffect(() => {
    // 1. Strict Target Origin check to prevent auth data theft
    if (!targetOrigin || !isValidOrigin(targetOrigin)) {
      console.error('SilentAuth blocked: Invalid or missing target origin:', targetOrigin);
      // Notify parent using standard wildcard fallback only if window.parent exists
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'SSO_AUTH_FAILED',
          message: 'Origin not whitelisted or missing parameter'
        }, '*'); // Wildcard only since origin is unknown, but payload is non-sensitive error
      }
      return;
    }

    const executeSilentCheck = async () => {
      try {
        // 2. Call backend session generation endpoint
        const response = await authService.generateSession(app);

        // 3. Post back success
        if (response && response.success) {
          window.parent.postMessage({
            type: 'SSO_AUTH_SUCCESS',
            payload: response.data || null
          }, targetOrigin);
        } else {
          window.parent.postMessage({
            type: 'SSO_AUTH_FAILED',
            message: 'Session generation returned invalid response.'
          }, targetOrigin);
        }
      } catch (err) {
        console.warn('Silent authentication failed:', (err as ApiError).message);
        window.parent.postMessage({
          type: 'SSO_AUTH_FAILED',
          message: (err as ApiError).message || 'Verification failed.'
        }, targetOrigin);
      }
    };

    executeSilentCheck();
  }, [app, targetOrigin]);

  // Completely blank page for iframe usage
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      SSO Silent Auth Channel
    </div>
  );
}

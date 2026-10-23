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

declare global {
    interface Window {
        _env_?: Record<string, string>
    }
}

const getEnv = (key: string): string => {
    const value = (typeof window !== 'undefined' && window._env_ && window._env_[key])
        || import.meta.env[key]

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`)
    }

    return value
}

export const API_URL = getEnv('VITE_API_URL');
export const SSO_URL = getEnv('VITE_SSO_URL');
export const FORGOT_PASSWORD_URL = getEnv('VITE_FORGOT_PASSWORD_URL');

// Optional: when unset, the login form renders without reCAPTCHA and sends no token.
export const RECAPTCHA_SITE_KEY =
    (typeof window !== 'undefined' && window._env_?.VITE_RECAPTCHA_SITE_KEY)
    || import.meta.env.VITE_RECAPTCHA_SITE_KEY
    || '';

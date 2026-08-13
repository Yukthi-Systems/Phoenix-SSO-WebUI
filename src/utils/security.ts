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

/**
 * Security utility helpers for the SSO Frontend UI
 */

export function getBaseDomain(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return '';
  }
  const parts = host.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return host;
}

export function getBrandName(): string {
  // Use environment variable for white-labeling, or fallback to generic name
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BRAND_NAME) {
    return import.meta.env.VITE_BRAND_NAME;
  }
  return 'Mail Service 25';
}

// Whitelist patterns for permitted client applications
const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,             // localhost with optional port
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,         // 127.0.0.1 with optional port
  /^https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app$/, // ngrok tunnel origin
];

/**
 * Validates whether the given origin is part of the permitted client applications.
 * This is critical to prevent postMessage theft or open redirects.
 */
export function isValidOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;

  // Normalize origin (remove trailing slash)
  const normalized = origin.replace(/\/$/, '');

  if (ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  // Dynamically match subdomains of the base domain of the current host
  const baseDomain = getBaseDomain();
  if (baseDomain) {
    const escapedDomain = baseDomain.replace(/\./g, '\\.');
    const dynamicPattern = new RegExp(`^https:\\/\\/([a-zA-Z0-9-]+\\.)+${escapedDomain}$`);
    if (dynamicPattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates and sanitizes redirect URLs to prevent Open Redirect vulnerabilities
 * and script insertion (javascript: schemes).
 */
export function sanitizeRedirectUrl(urlString: string | null | undefined): string {
  if (!urlString) return '/login';

  try {
    // If it's a relative URL, it is safe since it stays on the SSO domain
    if (urlString.startsWith('/') && !urlString.startsWith('//')) {
      return urlString;
    }

    const parsed = new URL(urlString);

    // 1. Enforce secure protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.warn('Blocked dangerous URL protocol:', parsed.protocol);
      return '/login';
    }

    // 2. Validate host origin
    if (isValidOrigin(parsed.origin)) {
      return urlString;
    }

    console.warn('Blocked unauthorized redirect origin:', parsed.origin);
    return '/unauthorized';
  } catch (error) {
    console.error('Error parsing redirect URL:', error);
    return '/login';
  }
}


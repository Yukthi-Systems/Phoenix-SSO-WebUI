/**
 * Security utility helpers for the SSO Frontend UI
 */

export function getBaseDomain() {
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

export function getBrandName() {
  const base = getBaseDomain();
  return base || 'SSO Portal';
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
 * 
 * @param {string} origin - The origin to validate
 * @returns {boolean} True if origin is whitelist-approved
 */
export function isValidOrigin(origin) {
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
 * 
 * @param {string} urlString - The destination URL string to validate
 * @returns {string} The validated absolute URL, or safe fallback (login route)
 */
export function sanitizeRedirectUrl(urlString) {
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

/**
 * Masks user email addresses to prevent PII exposure on MFA validation screens.
 * E.g., "john.doe@example.com" -> "jo******@example.com"
 * 
 * @param {string} email - The raw email address
 * @returns {string} The masked email address
 */
export function maskEmail(email) {
  if (!email || !email.includes('@')) return 'your email';
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  return `${localPart.substring(0, 2)}******@${domain}`;
}

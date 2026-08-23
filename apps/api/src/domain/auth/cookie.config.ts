/**
 * 🔐 Cookie Configuration - Shared Authentication Cookies
 *
 * Centralized cookie configuration for cross-domain SSO authentication.
 * Supports production (.rukny.io) and development (localhost) environments.
 */

import { randomBytes, timingSafeEqual } from 'crypto';
import type { CookieOptions, Response, Request } from 'express';
import {
  parseDurationToSeconds,
} from './auth-duration.util';

// ============================================================================
// Environment Configuration
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Secure flag — true only on HTTPS production.
 * docker-compose.rukny-dev sets COOKIE_SECURE=false for http://localhost.
 */
export const COOKIE_SECURE =
  isProduction &&
  process.env.COOKIE_SECURE !== 'false' &&
  process.env.COOKIE_SECURE !== '0';

/**
 * __Secure- / __Host- prefixes require the Secure attribute (browser will drop them on http://localhost).
 * Use prefixed names only when cookies are actually Secure.
 */
const usePrefixedCookieNames = isProduction && COOKIE_SECURE;

/**
 * Cookie Domain Configuration
 * - Production: .rukny.io (shared across all subdomains)
 * - Development: undefined (localhost, no domain)
 */
export const COOKIE_DOMAIN = isProduction
  ? process.env.COOKIE_DOMAIN === ''
    ? undefined
    : process.env.COOKIE_DOMAIN || '.rukny.io'
  : undefined;
const isHostOnlyCookieConfig = usePrefixedCookieNames && !COOKIE_DOMAIN;

/**
 * SameSite policy
 * - lax: allows cross-site GET requests (needed for OAuth redirects)
 * - strict: most secure but breaks OAuth
 * - none: requires secure=true and is less safe
 */
export const COOKIE_SAME_SITE: 'strict' | 'lax' | 'none' = 'lax';

/**
 * Cookie names — prefixed only when Secure cookies are enabled
 */
export const COOKIE_NAMES = {
  accessToken: usePrefixedCookieNames
    ? '__Secure-access_token'
    : 'access_token',
  refreshToken: usePrefixedCookieNames
    ? '__Secure-refresh_token'
    : 'refresh_token',
  // __Host- cookies require no Domain attribute, so only use them on host-only setups.
  csrfToken: isHostOnlyCookieConfig
    ? '__Host-csrf_token'
    : usePrefixedCookieNames
      ? '__Secure-csrf_token'
      : 'csrf_token',
  deviceId: isHostOnlyCookieConfig
    ? '__Host-device_id'
    : usePrefixedCookieNames
      ? '__Secure-device_id'
      : 'device_id',
  mailboxSession: usePrefixedCookieNames
    ? '__Secure-mail_mailbox_session'
    : 'mail_mailbox_session',
} as const;

/**
 * Token expiration times (in seconds)
 */
export const TOKEN_EXPIRY = {
  accessToken: parseDurationToSeconds(process.env.ACCESS_TOKEN_EXPIRES_IN, 30 * 60),
  refreshToken: parseDurationToSeconds(process.env.REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60),
  csrfToken: parseDurationToSeconds(process.env.ACCESS_TOKEN_EXPIRES_IN, 30 * 60),
  deviceId: 365 * 24 * 60 * 60, // 1 year
  mailboxSession: 12 * 60 * 60, // 12 hours
} as const;

// ============================================================================
// Base Cookie Options
// ============================================================================

/**
 * Base cookie options shared across all auth cookies
 */
const baseCookieOptions: CookieOptions = {
  domain: COOKIE_DOMAIN,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: '/',
};

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const trimmed = cookie.trim();
      if (!trimmed) return acc;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex < 1) return acc;

      const name = trimmed.slice(0, separatorIndex);
      const value = trimmed.slice(separatorIndex + 1);
      if (!name || !value) return acc;

      acc[name] = safeDecodeURIComponent(value);
      return acc;
    },
    {} as Record<string, string>,
  );
}

// ============================================================================
// Cookie Setters
// ============================================================================

/**
 * Set access token cookie
 */
export function setAccessTokenCookie(
  res: Response,
  token: string,
  maxAge?: number,
): void {
  res.cookie(COOKIE_NAMES.accessToken, token, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: (maxAge ?? TOKEN_EXPIRY.accessToken) * 1000,
  });
}

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(
  res: Response,
  token: string,
  maxAge?: number,
): void {
  res.cookie(COOKIE_NAMES.refreshToken, token, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: (maxAge ?? TOKEN_EXPIRY.refreshToken) * 1000,
  });
}

/**
 * Set CSRF token cookie
 */
export function setCsrfTokenCookie(
  res: Response,
  token: string,
  maxAge?: number,
): void {
  res.cookie(COOKIE_NAMES.csrfToken, token, {
    ...baseCookieOptions,
    httpOnly: false, // Must be accessible by JS
    maxAge: (maxAge ?? TOKEN_EXPIRY.csrfToken) * 1000,
  });
}

/**
 * Set device ID cookie for tracking
 */
export function setDeviceIdCookie(res: Response, deviceId: string): void {
  res.cookie(COOKIE_NAMES.deviceId, deviceId, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: TOKEN_EXPIRY.deviceId * 1000,
  });
}

export function setMailboxSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAMES.mailboxSession, token, {
    ...baseCookieOptions,
    httpOnly: true,
    maxAge: TOKEN_EXPIRY.mailboxSession * 1000,
  });
}

// ============================================================================
// Cookie Clearers
// ============================================================================

/**
 * Clear access token cookie
 */
export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.accessToken, {
    ...baseCookieOptions,
    httpOnly: true,
  });
  if (!isProduction) return;

  // Clear legacy names for backward compatibility.
  res.clearCookie('access_token', { ...baseCookieOptions, httpOnly: true });
  res.clearCookie('__Secure-access_token', {
    ...baseCookieOptions,
    httpOnly: true,
  });
}

/**
 * Clear refresh token cookie
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.refreshToken, {
    ...baseCookieOptions,
    httpOnly: true,
  });
  if (!isProduction) return;

  res.clearCookie('refresh_token', { ...baseCookieOptions, httpOnly: true });
  res.clearCookie('__Secure-refresh_token', {
    ...baseCookieOptions,
    httpOnly: true,
  });
}

/**
 * Clear CSRF token cookie
 */
export function clearCsrfTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.csrfToken, {
    ...baseCookieOptions,
    httpOnly: false,
  });
  if (!isProduction) return;

  res.clearCookie('csrf_token', { ...baseCookieOptions, httpOnly: false });
  res.clearCookie('__Secure-csrf_token', {
    ...baseCookieOptions,
    httpOnly: false,
  });
  res.clearCookie('__Host-csrf_token', {
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: '/',
    httpOnly: false,
  });
}

/**
 * Clear device ID cookie
 */
export function clearDeviceIdCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.deviceId, {
    ...baseCookieOptions,
    httpOnly: true,
  });
  if (!isProduction) return;

  res.clearCookie('device_id', { ...baseCookieOptions, httpOnly: true });
  res.clearCookie('__Secure-device_id', {
    ...baseCookieOptions,
    httpOnly: true,
  });
  res.clearCookie('__Host-device_id', {
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: '/',
    httpOnly: true,
  });
}

export function clearMailboxSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.mailboxSession, {
    ...baseCookieOptions,
    httpOnly: true,
  });
  if (!isProduction) return;
  res.clearCookie('mail_mailbox_session', {
    ...baseCookieOptions,
    httpOnly: true,
  });
  res.clearCookie('__Secure-mail_mailbox_session', {
    ...baseCookieOptions,
    httpOnly: true,
  });
}

export function extractMailboxSessionToken(req: Request): string | undefined {
  const cookies = parseCookieHeader(req.headers['cookie']);
  return (
    cookies[COOKIE_NAMES.mailboxSession] ||
    cookies['mail_mailbox_session'] ||
    cookies['__Secure-mail_mailbox_session']
  );
}

/**
 * Clear all auth cookies
 */
export function clearAuthCookies(res: Response): void {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
  clearCsrfTokenCookie(res);
  clearDeviceIdCookie(res);
  clearMailboxSessionCookie(res);
}

// ============================================================================
// Token Extraction
// ============================================================================

/**
 * Extract access token from request
 */
export function extractAccessToken(req: Request): string | undefined {
  const cookies = parseCookieHeader(req.headers['cookie']);

  return (
    cookies[COOKIE_NAMES.accessToken] ||
    cookies['access_token'] ||
    cookies['__Secure-access_token']
  );
}

/**
 * Extract refresh token from request
 */
export function extractRefreshToken(req: Request): string | undefined {
  const cookies = parseCookieHeader(req.headers['cookie']);

  return (
    cookies[COOKIE_NAMES.refreshToken] ||
    cookies['refresh_token'] ||
    cookies['__Secure-refresh_token']
  );
}

/**
 * Extract CSRF token from request
 */
export function extractCsrfToken(req: Request): string | undefined {
  // First try header
  const headerToken = req.headers['x-csrf-token'];
  if (headerToken) {
    return Array.isArray(headerToken) ? headerToken[0] : headerToken;
  }

  // Then try cookie
  const cookies = parseCookieHeader(req.headers['cookie']);

  return (
    cookies[COOKIE_NAMES.csrfToken] ||
    cookies['csrf_token'] ||
    cookies['__Host-csrf_token'] ||
    cookies['__Secure-csrf_token']
  );
}

/**
 * Extract trusted device ID from request
 */
export function getTrustedDeviceId(req: Request): string | undefined {
  const cookies = parseCookieHeader(req.headers['cookie']);

  return (
    cookies[COOKIE_NAMES.deviceId] ||
    cookies['device_id'] ||
    cookies['__Secure-device_id'] ||
    cookies['__Host-device_id']
  );
}

// ============================================================================
// CSRF Token Generation
// ============================================================================

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

function constantTimeTokenEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return timingSafeEqual(aBuffer, bBuffer);
}

// ============================================================================
// CSRF Validation
// ============================================================================

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(
  req: Request,
  originOnly: boolean = false,
): CsrfValidationResult {
  // In production, validate Origin/Referer headers
  if (isProduction) {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];

    // If origin is present, it must match our domain
    if (origin) {
      const normalizedOrigin = origin.replace(/\/+$/, '');
      const isLocalhostOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin);

      const allowedOrigins = [
        `https://rukny.io`,
        `https://www.rukny.io`,
        `https://app.rukny.io`,
        `https://accounts.rukny.io`,
        `https://business.rukny.io`,
        `https://forms.rukny.io`,
        `https://developers.rukny.io`,
        `https://hq.rukny.io`,
        `https://admin.rukny.io`,
        `https://mail.rukny.io`,
        process.env.FRONTEND_URL,
        process.env.AUTH_FRONTEND_URL,
        process.env.DEVELOPERS_FRONTEND_URL,
        process.env.BUSINESS_FRONTEND_URL,
        process.env.FORMS_FRONTEND_URL,
        process.env.HQ_FRONTEND_URL,
        process.env.MAIL_FRONTEND_URL,
        process.env.NEXT_PUBLIC_MAIL_URL,
      ]
        .filter(Boolean)
        .map((value) => value!.replace(/\/+$/, ''));

      if (!isLocalhostOrigin && !allowedOrigins.includes(normalizedOrigin)) {
        return { valid: false, reason: 'Invalid origin' };
      }
    }

    // Check referer as fallback
    if (!origin && referer) {
      try {
        const refererUrl = new URL(referer);
        const isLocalhost =
          refererUrl.hostname === 'localhost' ||
          refererUrl.hostname === '127.0.0.1';
        if (!refererUrl.hostname.endsWith('rukny.io') && !isLocalhost) {
          return { valid: false, reason: 'Invalid referer' };
        }
      } catch {
        return { valid: false, reason: 'Invalid referer URL' };
      }
    }
  }

  // In development or if we only want to validate origin (e.g. login endpoints), skip double-submit check
  if (isDevelopment || originOnly) {
    return { valid: true };
  }

  // Validate double-submit cookie pattern
  const cookieToken = extractCsrfToken(req);
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken) {
    return { valid: false, reason: 'Missing CSRF token' };
  }

  const headerTokenValue = Array.isArray(headerToken)
    ? headerToken[0]
    : headerToken;

  if (!constantTimeTokenEqual(cookieToken, headerTokenValue)) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }

  return { valid: true };
}

// ============================================================================
// Export all
// ============================================================================

export default {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setCsrfTokenCookie,
  setDeviceIdCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  clearCsrfTokenCookie,
  clearDeviceIdCookie,
  clearAuthCookies,
  extractAccessToken,
  extractRefreshToken,
  extractCsrfToken,
  getTrustedDeviceId,
  generateCsrfToken,
  validateCsrfToken,
};

// Utils - Core utility functions

import type { JWTPayload, UserRoleType } from '../types';
import { ROLE_HIERARCHY, hasRequiredRole } from '../types';

// ============================================================================
// Cookie Utilities
// ============================================================================

export interface CookieParseOptions {
  decode?: (value: string) => string;
}

export interface CookieSerializeOptions {
  domain?: string;
  encode?: (value: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  priority?: 'low' | 'medium' | 'high';
  sameSite?: true | false | 'lax' | 'strict' | 'none';
  secure?: boolean;
}

export function parseCookies(cookieHeader: string, options: CookieParseOptions = {}): Record<string, string> {
  const { decode = decodeURIComponent } = options;
  const cookies: Record<string, string> = {};

  if (typeof cookieHeader !== 'string') {
    return cookies;
  }

  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const index = pair.indexOf('=');

    if (index < 0) {
      continue;
    }

    const key = pair.substring(0, index).trim();
    const value = pair.substring(index + 1).trim();

    if (key) {
      cookies[key] = decode(value);
    }
  }

  return cookies;
}

export function serializeCookie(name: string, value: string, options: CookieSerializeOptions = {}): string {
  const {
    encode = encodeURIComponent,
    domain,
    expires,
    httpOnly,
    maxAge,
    path = '/',
    priority,
    sameSite,
    secure,
  } = options;

  let cookie = `${name}=${encode(value)}`;

  if (domain) {
    cookie += `; Domain=${domain}`;
  }

  if (expires) {
    cookie += `; Expires=${expires.toUTCString()}`;
  }

  if (httpOnly) {
    cookie += '; HttpOnly';
  }

  if (typeof maxAge === 'number' && !isNaN(maxAge)) {
    cookie += `; Max-Age=${Math.floor(maxAge)}`;
  }

  if (path) {
    cookie += `; Path=${path}`;
  }

  if (priority) {
    cookie += `; Priority=${priority}`;
  }

  if (sameSite) {
    cookie += `; SameSite=${sameSite === true ? 'Strict' : sameSite}`;
  }

  if (secure) {
    cookie += '; Secure';
  }

  return cookie;
}

// ============================================================================
// JWT Utilities
// ============================================================================

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload?.exp) {
    return true;
  }
  return payload.exp * 1000 < Date.now();
}

export function getTokenExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload?.exp) {
    return null;
  }
  return payload.exp * 1000;
}

// ============================================================================
// Security Utilities
// ============================================================================

export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function generateHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function sanitizeRedirectUrl(
  url: string | null | undefined,
  allowedHosts: string[] = []
): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url, 'http://localhost');

    if (!parsed.hostname || parsed.hostname === 'localhost') {
      return parsed.pathname + parsed.search;
    }

    const isAllowed = allowedHosts.some((host) => {
      return parsed.hostname === host || parsed.hostname.endsWith(`.${host}`);
    });

    if (isAllowed) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// URL Utilities
// ============================================================================

export function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function getBaseUrl(req?: { headers?: { host?: string }; protocol?: string }): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (req?.headers?.host) {
    const protocol = req.protocol || 'https';
    return `${protocol}://${req.headers.host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// ============================================================================
// Re-exports
// ============================================================================

export { ROLE_HIERARCHY, hasRequiredRole };

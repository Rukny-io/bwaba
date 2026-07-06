// Middleware - Shared authentication middleware factory
// Compatible with Next.js Edge Runtime

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { User, UserRoleType } from '../types';
import { isTokenExpired } from '../utils';
import { COOKIE_NAMES, getRedirectUrlByRole, APP_URLS } from '../config';

// ============================================================================
// Types
// ============================================================================

export interface MiddlewareConfig {
  /** App identifier */
  app: 'accounts' | 'business' | 'forms' | 'developers';
  /** Protected paths that require authentication */
  protectedPaths?: string[];
  /** Auth pages (redirect if already logged in) */
  authPages?: string[];
  /** Public paths (no auth check) */
  publicPaths?: string[];
  /** Role-based redirects */
  roleRedirects?: Partial<Record<UserRoleType, string>>;
  /** Default redirect after login */
  defaultRedirect?: string;
  /** Enable SSO redirects */
  enableSSO?: boolean;
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: User | null;
  tokenExpired: boolean;
  hasRefreshToken: boolean;
}

export interface MiddlewareResult {
  response: NextResponse;
  user: User | null;
  isAuthenticated: boolean;
}

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

// ============================================================================
// Cookie Extraction
// ============================================================================

/**
 * Extract access token from request cookies
 */
export function extractAccessToken(request: NextRequest): string | undefined {
  // Try secure cookie first (production), then regular cookie
  return (
    request.cookies.get(COOKIE_NAMES.accessToken)?.value ||
    request.cookies.get('access_token')?.value
  );
}

/**
 * Extract refresh token from request cookies
 */
export function extractRefreshToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(COOKIE_NAMES.refreshToken)?.value ||
    request.cookies.get('refresh_token')?.value
  );
}

/**
 * Extract CSRF token from request cookies
 */
export function extractCsrfToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(COOKIE_NAMES.csrfToken)?.value ||
    request.cookies.get('csrf_token')?.value
  );
}

/**
 * Check if request has any session cookies
 */
export function hasSessionCookies(request: NextRequest): boolean {
  return !!(extractAccessToken(request) || extractRefreshToken(request));
}

// ============================================================================
// Authentication Check
// ============================================================================

/**
 * Check authentication status from request
 */
export async function checkAuth(request: NextRequest): Promise<AuthCheckResult> {
  const accessToken = extractAccessToken(request);
  const refreshToken = extractRefreshToken(request);

  // No tokens = not authenticated
  if (!accessToken && !refreshToken) {
    return {
      isAuthenticated: false,
      user: null,
      tokenExpired: false,
      hasRefreshToken: false,
    };
  }

  // Check access token
  if (accessToken && !isTokenExpired(accessToken)) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
      const { payload } = await jwtVerify(accessToken, secret);

      return {
        isAuthenticated: true,
        user: {
          id: payload.sub as string,
          email: payload.email as string,
          role: payload.role as UserRoleType,
        } as User,
        tokenExpired: false,
        hasRefreshToken: !!refreshToken,
      };
    } catch (err) {
      // Invalid signature or format
    }
  }

  // Token expired or invalid
  if (accessToken) {
    return {
      isAuthenticated: false,
      user: null,
      tokenExpired: true,
      hasRefreshToken: !!refreshToken,
    };
  }

  // Only refresh token exists
  return {
    isAuthenticated: false,
    user: null,
    tokenExpired: true,
    hasRefreshToken: true,
  };
}

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Build accounts app URL
 */
export function buildAccountsUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, APP_URLS.accounts);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

/**
 * Get login URL with return path
 */
export function getLoginUrl(returnUrl?: string, options?: { expired?: boolean }): string {
  const params: Record<string, string> = {};
  if (returnUrl) {
    params.next = returnUrl;
  }
  if (options?.expired) {
    params.session = 'expired';
  }
  return buildAccountsUrl('/login', params);
}

/**
 * Get SSO redirect URL for cross-app authentication
 */
export function getSSORedirectUrl(targetApp: keyof typeof APP_URLS, token?: string): string {
  const baseUrl = APP_URLS[targetApp];
  const url = new URL('/auth/sso', baseUrl);
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
}

function resolveSafeNext(
  nextParam: string | null,
  baseUrl: string,
): string | null {
  if (!nextParam) return null;
  try {
    if (nextParam.startsWith('/')) {
      return nextParam;
    }
    const url = new URL(nextParam);
    const base = new URL(baseUrl);
    const host = url.hostname;
    const allowed =
      host === base.hostname ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.rukny.io') ||
      host === 'rukny.io';
    if (!allowed) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Parse cookies from cookie header
 */
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

/**
 * Serialize a cookie
 */
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
// Middleware Factory
// ============================================================================

/**
 * Create authentication middleware for Next.js
 */
export function createAuthMiddleware(config: MiddlewareConfig) {
  const {
    app,
    protectedPaths = [],
    authPages = [],
    publicPaths = [],
    roleRedirects,
    defaultRedirect = '/dashboard',
    enableSSO = true,
  } = config;

  // Normalize paths
  const normalizedProtected = protectedPaths.map((p) => p.toLowerCase());
  const normalizedAuth = authPages.map((p) => p.toLowerCase());
  const normalizedPublic = publicPaths.map((p) => p.toLowerCase());

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;
    const normalizedPath = pathname.toLowerCase();

    // Skip static files and API routes
    if (
      normalizedPath.startsWith('/_next') ||
      normalizedPath.startsWith('/api') ||
      normalizedPath.includes('.')
    ) {
      return NextResponse.next();
    }

    // Check if path is public
    const isPublic = normalizedPublic.some(
      (p) => normalizedPath === p || normalizedPath.startsWith(p + '/')
    );
    if (isPublic) {
      return NextResponse.next();
    }

    // Check authentication
    const auth = await checkAuth(request);

    // Check if path requires authentication
    const isProtected = normalizedProtected.some(
      (p) => normalizedPath === p || normalizedPath.startsWith(p + '/')
    );

    // Check if path is an auth page (login, register, etc.)
    const isAuthPage = normalizedAuth.some(
      (p) => normalizedPath === p || normalizedPath.startsWith(p + '/')
    );

    // Handle protected paths without authentication
    if (isProtected && !auth.isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = getLoginUrl(request.url, { expired: auth.tokenExpired });
      return NextResponse.redirect(loginUrl);
    }

    // Handle auth pages with authentication
    if (isAuthPage && auth.isAuthenticated && auth.user) {
      const sessionParam = request.nextUrl.searchParams.get('session');
      const redirectUrl =
        roleRedirects?.[auth.user.role] ||
        roleRedirects?.BASIC ||
        defaultRedirect;

      if (sessionParam === 'expired' || sessionParam === 'invalid') {
        if (!auth.tokenExpired) {
          const nextParam = request.nextUrl.searchParams.get('next');
          const target = resolveSafeNext(nextParam, request.url) || redirectUrl;
          return NextResponse.redirect(new URL(target, request.url));
        }
        const response = NextResponse.next();
        const domain = process.env.COOKIE_DOMAIN || '.rukny.io';
        const deleteOptions = { domain, path: '/' };
        response.cookies.delete({ name: 'access_token', ...deleteOptions });
        response.cookies.delete({ name: 'refresh_token', ...deleteOptions });
        response.cookies.delete({ name: 'csrf_token', ...deleteOptions });
        response.cookies.delete({ name: '__Secure-access_token', ...deleteOptions });
        response.cookies.delete({ name: '__Secure-refresh_token', ...deleteOptions });
        response.cookies.delete({ name: '__Host-csrf_token', ...deleteOptions });
        return response;
      }

      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();

    if (auth.isAuthenticated && auth.user) {
      response.headers.set('x-user-id', auth.user.id);
      response.headers.set('x-user-email', auth.user.email);
      response.headers.set('x-user-role', auth.user.role);
    }

    return response;
  };
}



// ============================================================================
// Export all
// ============================================================================

export default {
  createAuthMiddleware,
  extractAccessToken,
  extractRefreshToken,
  extractCsrfToken,
  hasSessionCookies,
  checkAuth,
  buildAccountsUrl,
  getLoginUrl,
  getSSORedirectUrl,
  parseCookies,
  serializeCookie,
};

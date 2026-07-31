// Middleware Factory - Creates Next.js middleware for authentication
// Compatible with Next.js Edge Runtime

import { NextRequest, NextResponse } from 'next/server';
import type { MiddlewareConfig } from './index';
import { 
  extractAccessToken, 
  extractRefreshToken 
} from './index';
import { COOKIE_NAMES, APP_URLS } from '../config';
import { decodeJWT, isTokenExpired } from '../utils';

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_PROTECTED_PATHS: Record<string, string[]> = {
  accounts: ['/onboarding'],
  business: ['/dashboard', '/settings'],
  forms: ['/app'],
  developers: ['/dashboard'],
};

const DEFAULT_AUTH_PAGES: Record<string, string[]> = {
  accounts: ['/login', '/check-email', '/choose-method', '/callback', '/complete-profile', '/auth/verify'],
  business: ['/login', '/register', '/callback', '/complete-profile', '/check-email'],
  forms: ['/login', '/callback'],
  developers: ['/login', '/callback'],
};

const DEFAULT_PUBLIC_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/images',
  '/assets',
  '/public',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if path matches any of the patterns
 */
function matchesPath(path: string, patterns: string[]): boolean {
  const normalizedPath = path.toLowerCase();
  return patterns.some((pattern) => {
    const normalizedPattern = pattern.toLowerCase();
    return normalizedPath === normalizedPattern || normalizedPath.startsWith(normalizedPattern + '/');
  });
}

/**
 * Get user from access token
 */
function getUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const payload = decodeJWT(token);
    if (!payload || isTokenExpired(token)) return null;

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Build accounts app URL for redirects
 */
function getAccountsUrl(path: string = '/', params?: Record<string, string>): string {
  const url = new URL(path, APP_URLS.accounts);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

// ============================================================================
// Middleware Factory
// ============================================================================

export function createMiddleware(config: MiddlewareConfig) {
  const {
    app,
    protectedPaths = DEFAULT_PROTECTED_PATHS[app] || [],
    authPages = DEFAULT_AUTH_PAGES[app] || [],
    publicPaths = DEFAULT_PUBLIC_PATHS,
    roleRedirects,
    defaultRedirect = '/dashboard',
    enableSSO = true,
  } = config;

  return function middleware(request: NextRequest): NextResponse {
    const { pathname, searchParams } = request.nextUrl;

    // Skip public paths
    if (matchesPath(pathname, publicPaths)) {
      return NextResponse.next();
    }

    // Check authentication
    const accessToken = extractAccessToken(request);
    const refreshToken = extractRefreshToken(request);
    const user = getUserFromToken(accessToken);
    const isAuthenticated = !!user;
    const isTokenExpired = !!accessToken && !user;

    // Determine path type
    const isProtected = matchesPath(pathname, protectedPaths);
    const isAuthPage = matchesPath(pathname, authPages);

    // Handle protected paths without authentication
    if (isProtected && !isAuthenticated) {
      // If we have a refresh token, try to refresh
      if (refreshToken && enableSSO) {
        // Redirect to refresh endpoint with return URL
        const refreshUrl = getAccountsUrl('/api/auth/refresh', {
          next: encodeURIComponent(request.url),
        });
        return NextResponse.redirect(refreshUrl);
      }

      // Redirect to login
      const loginUrl = getAccountsUrl('/login', {
        next: encodeURIComponent(request.url),
        ...(isTokenExpired && { session: 'expired' }),
      });
      return NextResponse.redirect(loginUrl);
    }

    // Handle auth pages with authentication
    if (isAuthPage && isAuthenticated && user) {
      const sessionParam = searchParams.get('session');
      const redirectUrl = roleRedirects?.[user.role] || defaultRedirect;

      if (sessionParam === 'expired' || sessionParam === 'invalid') {
        if (!isTokenExpired) {
          const nextParam = searchParams.get('next');
          let target = redirectUrl;
          if (nextParam) {
            try {
              if (nextParam.startsWith('/')) {
                target = nextParam;
              } else {
                const nextUrl = new URL(nextParam);
                const host = nextUrl.hostname;
                if (
                  host === 'localhost' ||
                  host === '127.0.0.1' ||
                  host.endsWith('.rukny.io') ||
                  host === 'rukny.io'
                ) {
                  target = nextUrl.pathname + nextUrl.search;
                }
              }
            } catch {
              // ignore invalid next
            }
          }
          return NextResponse.redirect(new URL(target, request.url));
        }
        const response = NextResponse.next();
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        response.cookies.delete('csrf_token');
        response.cookies.delete('__Secure-access_token');
        response.cookies.delete('__Secure-refresh_token');
        response.cookies.delete('__Host-csrf_token');
        return response;
      }

      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();

    if (isAuthenticated && user) {
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email);
      response.headers.set('x-user-role', user.role);
    }

    return response;
  };
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Create middleware for accounts app
 */
export function createAccountsMiddleware(options?: Partial<MiddlewareConfig>) {
  return createMiddleware({
    app: 'accounts',
    ...options,
  });
}

/**
 * Create middleware for business app
 */
export function createBusinessMiddleware(options?: Partial<MiddlewareConfig>) {
  return createMiddleware({
    app: 'business',
    ...options,
  });
}

/**
 * Create middleware for forms app
 */
export function createFormsMiddleware(options?: Partial<MiddlewareConfig>) {
  return createMiddleware({
    app: 'forms',
    ...options,
  });
}

/**
 * Create middleware for developers app
 */
export function createDevelopersMiddleware(options?: Partial<MiddlewareConfig>) {
  return createMiddleware({
    app: 'developers',
    ...options,
  });
}

// ============================================================================
// Export all
// ============================================================================

export default {
  createMiddleware,
  createAccountsMiddleware,
  createBusinessMiddleware,
  createFormsMiddleware,
  createDevelopersMiddleware,
};

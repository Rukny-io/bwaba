// Config - Core authentication configuration

import type { AuthCookies } from '../types';

// ============================================================================
// Environment
// ============================================================================

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ============================================================================
// Cookie Configuration
// ============================================================================

export const COOKIE_DOMAIN = IS_PRODUCTION 
  ? process.env.COOKIE_DOMAIN || '.rukny.io' 
  : undefined;

export const COOKIE_SECURE = IS_PRODUCTION;
export const COOKIE_SAME_SITE: 'strict' | 'lax' | 'none' = 'lax';

export const COOKIE_NAMES = {
  accessToken: IS_PRODUCTION ? '__Secure-access_token' : 'access_token',
  refreshToken: IS_PRODUCTION ? '__Secure-refresh_token' : 'refresh_token',
  csrfToken: IS_PRODUCTION ? '__Host-csrf_token' : 'csrf_token',
} as const;

export const TOKEN_EXPIRY = {
  accessToken: 30 * 60,
  refreshToken: 7 * 24 * 60 * 60,
  csrfToken: 30 * 60,
} as const;

export const AUTH_COOKIES: AuthCookies = {
  accessToken: {
    name: COOKIE_NAMES.accessToken,
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    domain: COOKIE_DOMAIN,
    path: '/',
    maxAge: TOKEN_EXPIRY.accessToken,
  },
  refreshToken: {
    name: COOKIE_NAMES.refreshToken,
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    domain: COOKIE_DOMAIN,
    path: '/',
    maxAge: TOKEN_EXPIRY.refreshToken,
  },
  csrfToken: {
    name: COOKIE_NAMES.csrfToken,
    httpOnly: false,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    domain: COOKIE_DOMAIN,
    path: '/',
    maxAge: TOKEN_EXPIRY.csrfToken,
  },
};

// ============================================================================
// URL Configuration
// ============================================================================

export const APP_URLS = {
  accounts: process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005',
  business: process.env.NEXT_PUBLIC_BUSINESS_URL || 'http://localhost:3003',
  forms: process.env.NEXT_PUBLIC_FORMS_URL || 'http://localhost:3007',
  developers: process.env.NEXT_PUBLIC_DEVELOPERS_URL || 'http://localhost:3004',
  api: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
} as const;

export const getAppUrl = (app: keyof typeof APP_URLS): string => {
  return APP_URLS[app];
};

// ============================================================================
// Role-Based Redirects
// ============================================================================

export const DEFAULT_REDIRECTS = {
  ADMIN: '/dashboard',
  PREMIUM: '/dashboard',
  BASIC: '/dashboard',
  GUEST: '/onboarding',
} as const;

export const ROLE_APP_REDIRECTS: Record<string, Record<string, string>> = {
  ADMIN: {
    default: '/dashboard',
    business: '/dashboard',
    accounts: '/onboarding',
  },
  PREMIUM: {
    default: '/dashboard',
    business: '/dashboard',
    accounts: '/onboarding',
  },
  BASIC: {
    default: '/dashboard',
    business: '/dashboard',
    accounts: '/onboarding',
  },
  GUEST: {
    default: '/onboarding',
    business: '/onboarding',
    accounts: '/onboarding',
  },
};

export const getRedirectUrlByRole = (
  role: string,
  options?: {
    targetApp?: string;
    defaultUrl?: string;
  }
): string => {
  const { targetApp, defaultUrl = '/dashboard' } = options || {};

  const roleRedirects = ROLE_APP_REDIRECTS[role] || ROLE_APP_REDIRECTS.BASIC;

  const redirectPath = targetApp
    ? roleRedirects[targetApp] || roleRedirects.default
    : roleRedirects.default;

  return redirectPath || defaultUrl;
};

export const getSafeRedirectUrl = (
  redirectUrl: string | null | undefined,
  role: string,
  options?: { targetApp?: string }
): string => {
  if (!redirectUrl) {
    return getRedirectUrlByRole(role, options);
  }

  try {
    const url = new URL(redirectUrl, 'http://localhost');

    if (url.hostname !== 'localhost' && url.hostname !== '') {
      return getRedirectUrlByRole(role, options);
    }

    return url.pathname + url.search;
  } catch {
    return getRedirectUrlByRole(role, options);
  }
};

// ============================================================================
// Middleware Configuration
// ============================================================================

export const DEFAULT_PROTECTED_PATHS: Record<string, string[]> = {
  accounts: ['/onboarding'],
  business: ['/dashboard'],
  forms: ['/app'],
  developers: ['/dashboard'],
};

export const DEFAULT_AUTH_PAGES: Record<string, string[]> = {
  accounts: ['/login', '/check-email', '/choose-method', '/callback', '/complete-profile'],
  business: ['/login', '/register', '/callback', '/complete-profile'],
  forms: ['/login', '/callback'],
  developers: ['/login', '/callback'],
};

// ============================================================================
// Security Configuration
// ============================================================================

export const RATE_LIMIT = {
  login: { limit: 5, window: 15 * 60 },
  refresh: { limit: 10, window: 60 },
  quicksign: { limit: 3, window: 15 * 60 },
} as const;

export const SESSION_CONFIG = {
  maxActiveSessions: 5,
  sessionTimeout: 30 * 60,
  absoluteTimeout: 7 * 24 * 60 * 60,
} as const;

// Middleware - Shared authentication middleware
// Compatible with Next.js Edge Runtime

export {
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
} from './middleware';

export type {
  MiddlewareConfig,
  AuthCheckResult,
  MiddlewareResult,
  CookieParseOptions,
  CookieSerializeOptions,
} from './middleware';

export { default } from './middleware';

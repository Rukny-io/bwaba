/**
 * Cookie names aligned with apps/api cookie.config and @rukny/auth.
 * Kept local so Edge middleware resolves without package subpath exports.
 */
const useSecureNames =
  process.env.NODE_ENV === 'production' &&
  process.env.COOKIE_SECURE !== 'false' &&
  process.env.COOKIE_SECURE !== '0';

export const AUTH_COOKIE_NAMES = {
  accessToken: useSecureNames ? '__Secure-access_token' : 'access_token',
  refreshToken: useSecureNames ? '__Secure-refresh_token' : 'refresh_token',
} as const;

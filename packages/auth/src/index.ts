// @rukny/auth - Shared Authentication Package
// Main exports

// Types
export * from './types';

// Config
export * from './config';

// Utils
export * from './utils';

// Hooks (client-side only)
export { useAuth, useSession, useRedirect } from './hooks';

// Providers (client-side only)
export { SharedAuthProvider, useSharedAuth } from './providers';

// Middleware
export {
  createAuthMiddleware,
  extractAccessToken,
  extractRefreshToken,
  extractCsrfToken,
  hasSessionCookies,
  checkAuth,
} from './middleware';

// Version
export const VERSION = '1.0.0';

// Default export
export default {
  VERSION,
};

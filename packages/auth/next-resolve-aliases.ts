/** Resolve @rukny/auth subpaths via materialized node_modules (relative paths for Turbopack). */
export function authResolveAliases(): Record<string, string> {
  const relSrc = './node_modules/@rukny/auth/src';
  return {
    '@rukny/auth/client/session-keepalive': `${relSrc}/client/session-keepalive.tsx`,
    '@rukny/auth/client/oauth-callback': `${relSrc}/client/oauth-callback.ts`,
    '@rukny/auth/client/oauth-exchange': `${relSrc}/client/oauth-exchange.ts`,
    '@rukny/auth/client/csrf-cookie': `${relSrc}/client/csrf-cookie.ts`,
    '@rukny/auth/client/env-urls': `${relSrc}/client/env-urls.ts`,
    '@rukny/auth/edge/check-edge-auth': `${relSrc}/edge/check-edge-auth.ts`,
    '@rukny/auth/edge/preview-access': `${relSrc}/edge/preview-access.ts`,
    '@rukny/auth/server': `${relSrc}/server/index.ts`,
  };
}

/** Resolve @rukny/auth subpaths via materialized node_modules (relative paths for Turbopack). */
export function authResolveAliases(): Record<string, string> {
  const relSrc = './node_modules/@rukny/auth/src';
  return {
    '@rukny/auth/client/session-keepalive': `${relSrc}/client/session-keepalive.tsx`,
    '@rukny/auth/server': `${relSrc}/server/index.ts`,
  };
}

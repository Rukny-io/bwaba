/** Resolve @rukny/auth subpaths via node_modules (Turbopack + file: junctions). */
export function authResolveAliases(): Record<string, string> {
  const relSrc = './node_modules/@rukny/auth/src';
  return {
    '@rukny/auth/client/session-keepalive': `${relSrc}/client/session-keepalive.tsx`,
    '@rukny/auth/server': `${relSrc}/server/index.ts`,
  };
}

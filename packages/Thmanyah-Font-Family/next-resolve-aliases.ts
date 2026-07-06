/** Resolve @rukny/thmanyah-font subpaths via node_modules (Docker symlinks + Turbopack exports). */
export function thmanyahFontResolveAliases(): Record<string, string> {
  const relSrc = './node_modules/@rukny/thmanyah-font/src';
  return {
    '@rukny/thmanyah-font/next': `${relSrc}/next.ts`,
    '@rukny/thmanyah-font/fonts.css': `${relSrc}/fonts.css`,
    '@rukny/thmanyah-font': `${relSrc}/index.ts`,
  };
}

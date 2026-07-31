import fs from 'node:fs';
import path from 'node:path';

function posix(p: string): string {
  return p.split(path.sep).join('/');
}

function resolveSrcDir(appRoot: string): string {
  const monorepo = path.resolve(appRoot, '../../packages/Thmanyah-Font-Family/src');
  const materialized = path.join(appRoot, 'node_modules/@rukny/thmanyah-font/src');

  // Prefer monorepo source — Node cannot strip .ts under node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING).
  if (fs.existsSync(path.join(monorepo, 'next.ts'))) {
    return monorepo;
  }

  if (fs.existsSync(path.join(materialized, 'next.ts'))) {
    return materialized;
  }

  return monorepo;
}

/** Resolve @rukny/thmanyah-font subpaths for Turbopack/webpack. */
export function thmanyahFontResolveAliases(
  appRoot?: string,
): Record<string, string> {
  if (appRoot) {
    const srcDir = resolveSrcDir(appRoot);
    return {
      '@rukny/thmanyah-font/next': posix(path.join(srcDir, 'next.ts')),
      '@rukny/thmanyah-font/fonts.css': posix(path.join(srcDir, 'fonts.css')),
      '@rukny/thmanyah-font': posix(path.join(srcDir, 'index.ts')),
    };
  }

  const relSrc = '../../packages/Thmanyah-Font-Family/src';
  return {
    '@rukny/thmanyah-font/next': `${relSrc}/next.ts`,
    '@rukny/thmanyah-font/fonts.css': `${relSrc}/fonts.css`,
    '@rukny/thmanyah-font': `${relSrc}/index.ts`,
  };
}

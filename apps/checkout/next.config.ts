import type { NextConfig } from 'next';
import path from 'node:path';
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

const monorepoAliases = {
  ...thmanyahFontResolveAliases(),
};

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
];

if (process.env.NODE_ENV === 'production') {
  securityHeaders.push(
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'Content-Security-Policy',
      value:
        "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.rukny.io",
    },
  );
}

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  transpilePackages: ['@heroui/react', '@heroui/styles', '@rukny/thmanyah-font'],
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: monorepoAliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...monorepoAliases,
    };
    return config;
  },
};

export default nextConfig;

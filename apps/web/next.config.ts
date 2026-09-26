import type { NextConfig } from 'next';
import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';
import { formsSharedResolveAliases } from '../../packages/forms-shared/next-resolve-aliases';
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const monorepoAliases = {
  ...formsSharedResolveAliases(),
  ...thmanyahFontResolveAliases(),
  '@rukny/email-api-pricing':
    './node_modules/@rukny/email-api-pricing/dist/index.js',
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@rukny/forms-shared',
    '@rukny/email-api-pricing',
    '@rukny/thmanyah-font',
  ],
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
  async rewrites() {
    const backend = API_BACKEND_URL.replace(/\/$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/api/v1/:path*`,
      },
      {
        source: '/api/media/:path*',
        destination: `${backend}/api/media/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { authResolveAliases } from '../../packages/auth/next-resolve-aliases';
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

/** Load monorepo root .env so middleware JWT_SECRET matches the API in local dev. */
function loadRootEnv(): void {
  const envPath = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadRootEnv();

const monorepoAliases = {
  ...authResolveAliases(),
  ...thmanyahFontResolveAliases(),
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';

const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
  process.env.FORM_PUBLIC_BASE_URL ||
  'https://rukny.io'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // App icon / profile uploads (max 2MB) through BFF route handler
    proxyClientMaxBodySize: '3mb',
  },
  transpilePackages: ['@heroui/react', '@heroui/styles', '@rukny/auth', '@rukny/thmanyah-font'],
  turbopack: {
    // Pin app root only (not the whole monorepo) so Turbopack does not index every app/package.
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/terms',
        destination: `${PUBLIC_SITE_URL}/terms`,
        permanent: true,
      },
      {
        source: '/privacy',
        destination: `${PUBLIC_SITE_URL}/privacy`,
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/api/media/:path*',
          destination: `${API_BACKEND_URL}/api/media/:path*`,
        },
        {
          source: '/api/v1/:path*',
          destination: `${API_BACKEND_URL}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;

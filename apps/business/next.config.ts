import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { authResolveAliases } from '../../packages/auth/next-resolve-aliases';
import { formsSharedResolveAliases } from '../../packages/forms-shared/next-resolve-aliases';
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

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

function applyLocalDevOverrides(): void {
  if (process.env.NODE_ENV !== 'development') return;
  const businessOrigin =
    process.env.DEV_HTTPS === '1'
      ? 'https://localhost:3003'
      : 'http://localhost:3003';
  process.env.NEXT_PUBLIC_ACCOUNTS_URL = 'http://localhost:3005';
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
  process.env.NEXT_PUBLIC_BUSINESS_URL = businessOrigin;
}

applyLocalDevOverrides();

const monorepoAliases = {
  ...formsSharedResolveAliases(),
  ...authResolveAliases(),
  ...thmanyahFontResolveAliases(),
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || 'http://localhost:3005';

const DEV_BUSINESS_ORIGIN =
  process.env.DEV_HTTPS === '1'
    ? 'https://localhost:3003'
    : 'http://localhost:3003';

const DEV_PUBLIC_ENV =
  process.env.NODE_ENV === 'development'
    ? {
        NEXT_PUBLIC_ACCOUNTS_URL: 'http://localhost:3005',
        NEXT_PUBLIC_API_URL: 'http://localhost:3001/api/v1',
        NEXT_PUBLIC_BUSINESS_URL: DEV_BUSINESS_ORIGIN,
      }
    : undefined;

const nextConfig: NextConfig = {
  output: 'standalone',
  ...(DEV_PUBLIC_ENV ? { env: DEV_PUBLIC_ENV } : {}),
  transpilePackages: [
    '@heroui/react',
    '@heroui/styles',
    '@rukny/auth',
    '@rukny/forms-shared',
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
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
        source: '/dashboard',
        destination: '/app',
        permanent: false,
      },
      {
        source: '/dashboard/:path*',
        destination: '/app/:path*',
        permanent: false,
      },
      {
        source: '/terms',
        destination: `${ACCOUNTS_URL.replace(/\/$/, '')}/terms`,
        permanent: true,
      },
      {
        source: '/privacy',
        destination: `${ACCOUNTS_URL.replace(/\/$/, '')}/privacy`,
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/media/:path*',
        destination: `${API_BACKEND_URL}/api/media/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

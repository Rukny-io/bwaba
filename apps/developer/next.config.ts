import type { NextConfig } from 'next';
import path from 'node:path';
import { authResolveAliases } from '../../packages/auth/next-resolve-aliases';
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

const monorepoAliases = {
  ...authResolveAliases(),
  ...thmanyahFontResolveAliases(),
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

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

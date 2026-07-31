import type { NextConfig } from 'next';
import path from 'node:path';
import { formsSharedResolveAliases } from '../../packages/forms-shared/next-resolve-aliases';
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

const monorepoAliases = {
  ...formsSharedResolveAliases(),
  ...thmanyahFontResolveAliases(),
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.0.179', '127.0.0.1', 'localhost'],
  transpilePackages: ['@rukny/forms-shared', '@rukny/thmanyah-font', '@heroui/react'],
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
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: '/api/media/:path*',
        destination: `${API_BACKEND_URL}/api/media/:path*`,
      },
    ];
  },
};

export default nextConfig;

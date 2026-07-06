import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const thmanyahAliases = thmanyahFontResolveAliases();

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@rukny/thmanyah-font"],
  turbopack: {
    resolveAlias: thmanyahAliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...thmanyahAliases,
    };
    return config;
  },
  experimental: {
    // Allow identity document uploads (~5 MB) through route handlers / proxy
    proxyClientMaxBodySize: "6mb",
  },
  async headers() {
    return [
      {
        // تطبيق ترويسات الأمان على جميع المسارات
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  // حماية: عدم كشف متغيرات البيئة الحساسة
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  async rewrites() {
    return [
      {
        source: "/api/media/:path*",
        destination: `${API_BACKEND_URL}/api/media/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${API_BACKEND_URL}/api/users/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

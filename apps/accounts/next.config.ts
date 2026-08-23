import type { NextConfig } from "next";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import createNextIntlPlugin from 'next-intl/plugin';
import { authResolveAliases } from '../../packages/auth/next-resolve-aliases';

const monorepoAliases = authResolveAliases();

// Monorepo: load root .env / .env.dev so OAuth flags work when running from apps/accounts
const repoRoot = path.resolve(__dirname, "../..");
loadEnvConfig(repoRoot, process.env.NODE_ENV !== "production");
loadEnvConfig(__dirname, process.env.NODE_ENV !== "production");

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@rukny/thmanyah-font",
    "@rukny/auth",
    "@heroui/react",
    "@heroui/styles",
  ],
  turbopack: {
    // Pin app root only — without this Turbopack indexes the whole monorepo and RAM spikes.
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
    NEXT_PUBLIC_FORMS_URL:
      process.env.NEXT_PUBLIC_FORMS_URL || "http://localhost:3007",
    NEXT_PUBLIC_MAIL_URL:
      process.env.NEXT_PUBLIC_MAIL_URL || "http://localhost:3009",
    NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED:
      process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED ?? "true",
    NEXT_PUBLIC_OAUTH_LINKEDIN_ENABLED:
      process.env.NEXT_PUBLIC_OAUTH_LINKEDIN_ENABLED ?? "true",
    NEXT_PUBLIC_OAUTH_GITHUB_ENABLED:
      process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED ??
      process.env.OAUTH_GITHUB_ENABLED ??
      "true",
    NEXT_PUBLIC_OAUTH_FACEBOOK_ENABLED:
      process.env.NEXT_PUBLIC_OAUTH_FACEBOOK_ENABLED ?? "false",
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

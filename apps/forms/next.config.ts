import type { NextConfig } from "next";
import path from "node:path";
import { authResolveAliases } from "../../packages/auth/next-resolve-aliases";
import { formsSharedResolveAliases } from "../../packages/forms-shared/next-resolve-aliases";
import { thmanyahFontResolveAliases } from "../../packages/Thmanyah-Font-Family/next-resolve-aliases";

const monorepoAliases = {
  ...formsSharedResolveAliases(),
  ...authResolveAliases(),
  ...thmanyahFontResolveAliases(),
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@rukny/forms-shared", "@rukny/auth", "@rukny/thmanyah-font"],
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
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/app/forms/new",
        destination: "/forms/n/new",
        permanent: false,
      },
      {
        source: "/app/notifications",
        destination: "/app?notifications=1",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/media/:path*",
        destination: `${API_BACKEND_URL}/api/media/:path*`,
      },
      // /api/v1 is proxied via app/api/v1/[...path]/route.ts (forwards DELETE bodies)
    ];
  },
};

export default nextConfig;

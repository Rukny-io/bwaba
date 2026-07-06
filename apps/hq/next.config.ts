import type { NextConfig } from "next";
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

const thmanyahAliases = thmanyahFontResolveAliases();

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@heroui/react", "@heroui/styles", "@rukny/auth", "@rukny/thmanyah-font"],
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
  images: {
    remotePatterns: [
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
  async rewrites() {
    return [
      {
        source: "/api/media/:path*",
        destination: `${API_BACKEND_URL}/api/media/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${API_BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

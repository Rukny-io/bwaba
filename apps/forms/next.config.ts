import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";
import { authResolveAliases } from "../../packages/auth/next-resolve-aliases";
import { formsSharedResolveAliases } from "../../packages/forms-shared/next-resolve-aliases";
import { thmanyahFontResolveAliases } from "../../packages/Thmanyah-Font-Family/next-resolve-aliases";

/** Load monorepo root .env so middleware JWT_SECRET matches the API in local dev. */
function loadRootEnv(): void {
  const envPath = path.resolve(__dirname, "../../.env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
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
  ...formsSharedResolveAliases(),
  ...authResolveAliases(),
  ...thmanyahFontResolveAliases(),
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || "http://localhost:3005";

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
        source: "/terms",
        destination: `${ACCOUNTS_URL.replace(/\/$/, "")}/terms`,
        permanent: false,
      },
      {
        source: "/privacy",
        destination: `${ACCOUNTS_URL.replace(/\/$/, "")}/privacy`,
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

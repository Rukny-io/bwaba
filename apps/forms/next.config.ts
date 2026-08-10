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

/** Root `.env` targets production; local `next dev` must hit localhost services. */
function applyLocalDevOverrides(): void {
  if (process.env.NODE_ENV !== "development") return;
  process.env.NEXT_PUBLIC_ACCOUNTS_URL = "http://localhost:3005";
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001/api/v1";
  process.env.NEXT_PUBLIC_FORMS_URL = "http://localhost:3007";
}

applyLocalDevOverrides();

const monorepoAliases = {
  ...formsSharedResolveAliases(),
  ...authResolveAliases(),
  ...thmanyahFontResolveAliases(),
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || "http://localhost:3005";

const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
  process.env.FORM_PUBLIC_BASE_URL ||
  "http://localhost:3006"
).replace(/\/$/, "");

const DEV_PUBLIC_ENV =
  process.env.NODE_ENV === "development"
    ? {
        NEXT_PUBLIC_ACCOUNTS_URL: "http://localhost:3005",
        NEXT_PUBLIC_API_URL: "http://localhost:3001/api/v1",
        NEXT_PUBLIC_FORMS_URL: "http://localhost:3007",
      }
    : undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  ...(DEV_PUBLIC_ENV ? { env: DEV_PUBLIC_ENV } : {}),
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
        destination: `${PUBLIC_SITE_URL}/terms`,
        permanent: true,
      },
      {
        source: "/privacy",
        destination: `${PUBLIC_SITE_URL}/privacy`,
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/media/:path*",
        destination: `${API_BACKEND_URL}/api/media/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${API_BACKEND_URL}/uploads/:path*`,
      },
      // /api/v1 is proxied via app/api/v1/[...path]/route.ts (forwards DELETE bodies)
    ];
  },
};

export default nextConfig;

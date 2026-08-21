import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";
import { authResolveAliases } from "../../packages/auth/next-resolve-aliases";
import { thmanyahFontResolveAliases } from "../../packages/Thmanyah-Font-Family/next-resolve-aliases";

const appRoot = __dirname;
const thmanyahAliases = thmanyahFontResolveAliases();
const authAliases = authResolveAliases();
const herouiAliases = {
  "@heroui/react": "./packages/react/src/index.ts",
  "@heroui/styles": "./packages/styles/src/index.ts",
  "@heroui/styles/css": "./packages/styles/index.css",
};

function loadRootEnv(): void {
  const names = [".env.local", ".env.dev", ".env", ".env.production"];
  for (const name of names) {
    const envPath = path.resolve(appRoot, "../..", name);
    if (!fs.existsSync(envPath)) continue;
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
}

loadRootEnv();

const monorepoAliases = {
  ...authAliases,
  ...thmanyahAliases,
  ...herouiAliases,
  jose: "./node_modules/jose",
};

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const ACCOUNTS_URL =
  process.env.NEXT_PUBLIC_ACCOUNTS_URL || "http://localhost:3005";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@heroui/react",
    "@heroui/styles",
    "@rukny/auth",
    "@rukny/thmanyah-font",
  ],
  // Keep ioredis (and its CJS deps) outside Turbopack/webpack bundling.
  serverExternalPackages: ["ioredis"],
  turbopack: {
    root: path.resolve(appRoot),
    resolveAlias: monorepoAliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...authResolveAliases(),
      ...thmanyahFontResolveAliases(appRoot),
      jose: path.resolve(appRoot, "node_modules/jose"),
      "@heroui/react": path.resolve(appRoot, "packages/react/src/index.ts"),
      "@heroui/styles": path.resolve(appRoot, "packages/styles/src/index.ts"),
      "@heroui/styles/css": path.resolve(appRoot, "packages/styles/index.css"),
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
        source: "/terms",
        destination: `${ACCOUNTS_URL.replace(/\/$/, "")}/terms`,
        permanent: true,
      },
      {
        source: "/privacy",
        destination: `${ACCOUNTS_URL.replace(/\/$/, "")}/privacy`,
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      // Safety net: /u{N}/… has no App Router pages; map to product paths if proxy skips.
      // Ownership/cookie binding still happens in proxy.ts when it runs.
      beforeFiles: [
        {
          source: "/u:slot(\\d+)/:path*",
          destination: "/:path*",
        },
        {
          source: "/u:slot(\\d+)",
          destination: "/app",
        },
      ],
      afterFiles: [
        {
          source: "/api/media/:path*",
          destination: `${API_BACKEND_URL.replace(/\/$/, "")}/api/media/:path*`,
        },
        {
          source: "/uploads/:path*",
          destination: `${API_BACKEND_URL.replace(/\/$/, "")}/uploads/:path*`,
        },
        {
          source: "/api/v1/:path*",
          destination: `${API_BACKEND_URL.replace(/\/$/, "")}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;

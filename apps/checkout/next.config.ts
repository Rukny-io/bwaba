import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';
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
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
  process.env.NEXT_PUBLIC_CHECKOUT_URL = 'http://localhost:3010';
}

applyLocalDevOverrides();

const monorepoAliases = {
  ...thmanyahFontResolveAliases(),
};

const DEV_PUBLIC_ENV =
  process.env.NODE_ENV === 'development'
    ? {
        NEXT_PUBLIC_API_URL: 'http://localhost:3001/api/v1',
        NEXT_PUBLIC_CHECKOUT_URL: 'http://localhost:3010',
      }
    : undefined;

const nextConfig: NextConfig = {
  output: 'standalone',
  ...(DEV_PUBLIC_ENV ? { env: DEV_PUBLIC_ENV } : {}),
  transpilePackages: ['@heroui/react', '@heroui/styles', '@rukny/thmanyah-font'],
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
};

export default nextConfig;

import type { NextConfig } from "next";
import { thmanyahFontResolveAliases } from '../../packages/Thmanyah-Font-Family/next-resolve-aliases';

const thmanyahAliases = thmanyahFontResolveAliases();

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ['@rukny/thmanyah-font'],
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
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@rukny/thmanyah-font",
    "@heroui/react",
    "@heroui/styles",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

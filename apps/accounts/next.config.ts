import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // حماية: عدم كشف متغيرات البيئة الحساسة
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
};

export default nextConfig;

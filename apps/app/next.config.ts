import type { NextConfig } from "next";

const API_BACKEND_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ],
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        // Forward API requests to the backend
        // /api/v1/* → http://localhost:3001/api/v1/*
        {
          source: '/api/v1/:path*',
          destination: `${API_BACKEND_URL}/api/v1/:path*`,
        },
        // Note: /api/auth/* and /api/users/* are handled by Route Handlers
        // for reliable Set-Cookie header forwarding
        // But as fallback, also rewrite /api/users/* directly
        {
          source: '/api/users/:path*',
          destination: `${API_BACKEND_URL}/api/v1/user/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;


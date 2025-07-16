// next.config.ts
import { config } from 'dotenv';
import type { NextConfig } from 'next';

// Load environment variables from .env file
config();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Environment variables with NEXT_PUBLIC_ prefix are automatically
  // exposed to the browser by Next.js. No need to list them here.
};

export default nextConfig;

import type { NextConfig } from 'next';

const BACKEND = process.env.NODE_ENV === 'production'
  ? 'https://sdopi-backend.vercel.app'
  : 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

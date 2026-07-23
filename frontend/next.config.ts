import type { NextConfig } from 'next';

const BACKEND = process.env.NODE_ENV === 'production'
  ? 'https://sdopi-backend.vercel.app'
  : 'http://localhost:3001';

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;

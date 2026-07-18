import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'worker',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@landnote/shared'],
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://127.0.0.1:3001/:path*',
      },
    ];
  },
};

export default withPWA(nextConfig);

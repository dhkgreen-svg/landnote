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
};

export default withPWA(nextConfig);

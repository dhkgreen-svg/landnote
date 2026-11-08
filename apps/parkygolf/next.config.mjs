/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // 1. Legacy domain parkongolf.com -> https://www.parkgolfallinone.com (301 Permanent)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'parkongolf.com',
          },
        ],
        destination: 'https://www.parkgolfallinone.com/:path*',
        permanent: true,
      },
      // 2. Legacy domain www.parkongolf.com -> https://www.parkgolfallinone.com (301 Permanent)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.parkongolf.com',
          },
        ],
        destination: 'https://www.parkgolfallinone.com/:path*',
        permanent: true,
      },
      // 3. Apex domain parkgolfallinone.com -> https://www.parkgolfallinone.com (301 Permanent)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'parkgolfallinone.com',
          },
        ],
        destination: 'https://www.parkgolfallinone.com/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

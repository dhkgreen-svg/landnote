import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/round/active', '/round/waiting'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/round/active', '/round/waiting'],
      },
      {
        userAgent: 'Mediapartners-Google', // Google AdSense crawler
        allow: '/',
      },
    ],
    sitemap: 'https://www.parkgolfallinone.com/sitemap.xml',
    host: 'https://www.parkgolfallinone.com',
  };
}

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.playdopewars.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/preview/', '/setup-account'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

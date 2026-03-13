import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return [
    { url: baseUrl, lastModified: new Date('2026-03-12'), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/how-to-play`, lastModified: new Date('2026-03-12'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date('2026-03-12'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/leaderboard?mode=pro_30`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/leaderboard?mode=pro_45`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/leaderboard?mode=pro_60`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/game`, lastModified: new Date('2026-03-01'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/upgrade`, lastModified: new Date('2026-03-01'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date('2026-01-01'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date('2026-01-01'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date('2025-12-01'), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: new Date('2025-12-01'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}

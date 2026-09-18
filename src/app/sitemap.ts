import type { MetadataRoute } from 'next';
import { blogBaseUrl, strategyPost } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = blogBaseUrl;

  return [
    { url: baseUrl, lastModified: new Date('2026-09-18'), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/how-to-play`, lastModified: new Date('2026-09-18'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(strategyPost.modified), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}${strategyPost.path}`, lastModified: new Date(strategyPost.modified), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date('2026-09-18'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/press`, lastModified: new Date('2026-09-18'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/leaderboard`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/upgrade`, lastModified: new Date('2026-09-18'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: new Date('2025-12-01'), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: new Date('2026-09-18'), changeFrequency: 'yearly', priority: 0.2 },
  ];
}

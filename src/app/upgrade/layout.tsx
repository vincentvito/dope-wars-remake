import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Go Pro — Unlock the Full Dope Wars Experience',
  description: 'Upgrade to Dope Wars Pro for $7.99. Extended campaigns, labs, warehouses, global routes, and Pro leaderboards. One-time payment, play forever.',
  alternates: { canonical: '/upgrade' },
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Dope Wars Pro',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '7.99',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        description: 'Extended campaigns up to 60 days with drug labs, warehouses, international plane routes, plantations, weapons, and Pro leaderboards.',
        url: `${appUrl}/upgrade`,
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
          { '@type': 'ListItem', position: 2, name: 'Go Pro', item: `${appUrl}/upgrade` },
        ],
      }} />
    </>
  );
}

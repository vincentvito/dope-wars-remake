import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Go Pro — Unlock the Full Dope Wars Experience',
  description: 'Upgrade to Dope Wars Pro for $7.99. Extended campaigns, labs, warehouses, global routes, and Pro leaderboards. One-time payment, play forever.',
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

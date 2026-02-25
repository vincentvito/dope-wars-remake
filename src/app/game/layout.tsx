import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Play Dope Wars — Drug Trading Game',
  description: 'Play Dope Wars now. Buy and sell drugs across New York, dodge cops, and build your empire in this classic drug war game.',
  robots: { index: false },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children;
}

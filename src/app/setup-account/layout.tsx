import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set up your account', robots: { index: false, follow: false },
  alternates: { canonical: '/setup-account' },
};

export default function SetupAccountLayout({ children }: { children: React.ReactNode }) { return children; }

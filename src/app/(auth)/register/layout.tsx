import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a free Dope Wars account. Track your scores and compete on the global drug dealer leaderboard.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Dope Wars account to save progress and submit scores to the global leaderboard.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import { getLeaderboard } from '@/actions/leaderboard';
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient';
import { JsonLd } from '@/components/seo/JsonLd';
import Link from 'next/link';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Leaderboard — Top Drug Dealers',
  description: 'See who rules the streets. Top Dope Wars scores from players worldwide. Can you beat the best drug dealers in the game?',
};

export const revalidate = 300; // Revalidate every 5 minutes

const VALID_MODES = ['pro_30', 'pro_45', 'pro_60'] as const;
type LeaderboardMode = (typeof VALID_MODES)[number];

function isValidMode(mode: string | undefined): mode is LeaderboardMode {
  return VALID_MODES.includes(mode as LeaderboardMode);
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = isValidMode(params.mode) ? params.mode : 'pro_30';
  const { entries, totalCount } = await getLeaderboard({ gameMode: mode, page: 1 });

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel text-lg text-crt-green text-glow-green">
            LEADERBOARD
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Top Pro dealers
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/game" className="retro-btn text-[10px] px-3 py-1.5">
            Play
          </Link>
          <Link href="/" className="retro-btn retro-btn-amber text-[10px] px-3 py-1.5">
            Home
          </Link>
        </div>
      </div>

      <LeaderboardClient
        initialEntries={entries}
        totalCount={totalCount}
        initialMode={mode}
      />

      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
          { '@type': 'ListItem', position: 2, name: 'Leaderboard', item: `${appUrl}/leaderboard` },
        ],
      }} />
    </main>
  );
}

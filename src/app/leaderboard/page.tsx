import { siteUrl } from '@/lib/site';
import type { Metadata } from 'next';
import { getLeaderboard } from '@/actions/leaderboard';
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient';
import { JsonLd } from '@/components/seo/JsonLd';
import Link from 'next/link';
import { isLeaderboardMode } from '@/lib/leaderboard';

const appUrl = siteUrl;

export const metadata: Metadata = {
  title: 'Leaderboard — Top Drug Dealers',
  description: 'See who rules the streets. Top Dope Wars scores from players worldwide. Can you beat the best drug dealers in the game?',
  alternates: { canonical: '/leaderboard' },
};

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = isLeaderboardMode(params.mode) ? params.mode : '30';
  const { entries, totalCount, error } = await getLeaderboard({ gameMode: mode, page: 1 });

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel text-lg text-crt-green text-glow-green">
            LEADERBOARD
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Finish a run. Post your score. Climb the ranks.
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
        key={mode}
        initialEntries={entries}
        totalCount={totalCount}
        initialMode={mode}
        initialError={error}
      />

      <p className="text-xs text-muted-foreground mt-8">Classic scores count cash plus bank savings, minus debt, plus inventory value. At the time limit, unsold inventory uses its recorded average cost. Submitted runs are replayed and validated on the server. This does not eliminate every form of automated play.</p>
      {/* Related guides */}
      <div className="text-xs text-muted-foreground leading-relaxed mt-8 space-y-2 border-t border-crt-green/10 pt-6">
        <p>
          Want to climb the ranks? Read the{' '}
          <Link href="/blog/dope-wars-strategy" className="text-crt-cyan hover:underline">strategy guide</Link>{' '}
          for tips on maximizing your net worth.
        </p>
        <p>
          Unlock extended campaigns and compete on Pro leaderboards with{' '}
          <Link href="/upgrade" className="text-crt-amber hover:underline">Dope Wars Pro</Link>.
        </p>
      </div>

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

import { getLeaderboard } from '@/actions/leaderboard';
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const { entries, totalCount } = await getLeaderboard({ gameMode: '30', page: 1 });

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel text-lg text-crt-green text-glow-green">
            LEADERBOARD
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Top dealers — 30 Day Classic
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

      <LeaderboardClient initialEntries={entries} totalCount={totalCount} />
    </main>
  );
}

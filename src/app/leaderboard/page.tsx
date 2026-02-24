import { getLeaderboard } from '@/actions/leaderboard';
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
    </main>
  );
}

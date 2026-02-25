'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { getUserStats, type UserStats } from '@/actions/stats';
import { formatCurrency } from '@/lib/utils';

interface StatisticsOverlayProps {
  onClose: () => void;
}

export function StatisticsOverlay({ onClose }: StatisticsOverlayProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isPro = useAuthStore((s) => s.isPro);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isLoggedIn && isPro) {
      setLoading(true);
      setError(null);
      getUserStats()
        .then(({ stats, error }) => {
          if (error) setError(error);
          else if (stats) setStats(stats);
        })
        .catch(() => setError('Failed to load stats'))
        .finally(() => setLoading(false));
    }
  }, [isLoaded, isLoggedIn, isPro]);

  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-6">
      <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
        STATISTICS
      </h2>

      {/* Auth not loaded yet */}
      {!isLoaded && (
        <p className="text-xs text-crt-amber animate-pulse py-4">
          Loading...
        </p>
      )}

      {/* Not logged in or not PRO */}
      {isLoaded && (!isLoggedIn || !isPro) && (
        <div className="w-full space-y-4 text-center">
          <p className="text-xs text-muted-foreground">
            Upgrade to PRO to view your stats
          </p>
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="retro-btn retro-btn-amber block w-full py-3 text-xs font-pixel"
            >
              SIGN IN
            </Link>
          ) : (
            <Link
              href="/upgrade"
              className="retro-btn retro-btn-amber block w-full py-3 text-xs font-pixel"
            >
              GO PRO — $7.99
            </Link>
          )}
        </div>
      )}

      {/* Loading stats */}
      {isLoaded && isLoggedIn && isPro && loading && (
        <p className="text-xs text-crt-amber animate-pulse py-4">
          Loading stats...
        </p>
      )}

      {/* Error state */}
      {isLoaded && isLoggedIn && isPro && error && !loading && (
        <p className="text-xs text-crt-red py-4">
          {error}
        </p>
      )}

      {/* Stats display */}
      {isLoaded && isLoggedIn && isPro && stats && !loading && (
        <>
          {stats.gamesPlayed === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Play and submit a PRO game to see your stats!
            </p>
          ) : (
            <div className="w-full space-y-2">
              <StatRow
                label="GAMES PLAYED"
                value={String(stats.gamesPlayed)}
              />
              <StatRow
                label="AVG NET WORTH"
                value={formatCurrency(stats.avgNetWorth)}
                color={stats.avgNetWorth >= 0 ? 'text-crt-green' : 'text-crt-red'}
              />
              <StatRow
                label="BEST TRADE"
                value={
                  stats.bestTradeDrug
                    ? `${formatCurrency(stats.bestTradeProfit)} (${stats.bestTradeDrug})`
                    : 'N/A'
                }
                color="text-crt-green"
              />
              <StatRow
                label="WORST TRADE"
                value={
                  stats.worstTradeDrug
                    ? `-${formatCurrency(stats.worstTradeLoss)} (${stats.worstTradeDrug})`
                    : 'N/A'
                }
                color="text-crt-red"
              />
              <StatRow
                label="MOST TRADED"
                value={
                  stats.mostTradedDrug
                    ? `${stats.mostTradedDrug} (${stats.mostTradedDrugCount}x)`
                    : 'N/A'
                }
              />
              <StatRow
                label="BIGGEST MUG"
                value={
                  stats.biggestMugging > 0
                    ? formatCurrency(stats.biggestMugging)
                    : 'N/A'
                }
                color="text-crt-red"
              />
            </div>
          )}
        </>
      )}

      <button
        className="retro-btn w-full py-3 text-xs font-pixel"
        onClick={onClose}
      >
        BACK
      </button>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border border-[#222] bg-black/40">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-xs font-pixel ${color ?? 'text-crt-cyan'}`}>
        {value}
      </span>
    </div>
  );
}

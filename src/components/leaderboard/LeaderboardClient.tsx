'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LEADERBOARD_MODES } from '@/lib/leaderboard';
import { getLeaderboard, searchLeaderboard, type LeaderboardEntry } from '@/actions/leaderboard';
import { formatCurrency } from '@/lib/utils';

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  totalCount: number;
  initialMode?: string;
  initialError?: string;
}

export function LeaderboardClient({ initialEntries, totalCount, initialMode = '30', initialError }: LeaderboardClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [count, setCount] = useState(totalCount);
  const [activeMode, setActiveMode] = useState(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(initialError);

  // Request ID to discard stale responses
  const requestIdRef = useRef(0);
  // Debounce timer for search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    requestIdRef.current++;
  }, []);

  const load = async (mode: string, query: string) => {
    const reqId = ++requestIdRef.current;
    const searching = query.trim().length >= 2;
    setIsLoading(true);
    setError(undefined);
    try {
      const result = searching
        ? await searchLeaderboard(query.trim(), mode)
        : await getLeaderboard({ gameMode: mode, page: 1 });
      if (reqId !== requestIdRef.current) return;
      setEntries(result.entries);
      setCount(result.totalCount);
      setIsSearching(searching);
      setError(result.error);
    } catch {
      if (reqId !== requestIdRef.current) return;
      setEntries([]);
      setCount(0);
      setError('The leaderboard is temporarily unavailable. Please try again.');
    } finally {
      if (reqId === requestIdRef.current) setIsLoading(false);
    }
  };

  const handleModeSwitch = (mode: string) => {
    if (mode === activeMode) return;
    clearTimeout(debounceRef.current);
    setActiveMode(mode);
    setSearchQuery('');
    setIsSearching(false);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState(null, '', url);
    void load(mode, '');
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    clearTimeout(debounceRef.current);
    // Invalidate in-flight results immediately, before the debounce fires.
    requestIdRef.current++;
    setIsLoading(true);
    debounceRef.current = setTimeout(() => void load(activeMode, query), 300);
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-1">
        {LEADERBOARD_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => handleModeSwitch(mode.value)}
            aria-pressed={activeMode === mode.value}
            aria-label={mode.name}
            className={`flex-1 min-h-11 py-2 text-[10px] font-pixel border transition-colors ${
              activeMode === mode.value
                ? 'bg-crt-amber/20 border-crt-amber/50 text-crt-amber'
                : 'bg-transparent border-[#333] text-muted-foreground hover:border-[#555]'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {activeMode === '30'
          ? 'Classic is free. Finish a run, enter a nickname and post your score. No account needed.'
          : 'Pro runs compete separately. Finish a run and post from the result screen.'}
      </p>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="search"
          aria-label="Search by username"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search by username..."
          className="min-w-0 flex-1 min-h-11 bg-[#0a0a0a] border border-[#333] text-xs text-foreground px-3 py-2"
        />
        {isLoading && (
          <span className="text-xs text-muted-foreground self-center">Loading...</span>
        )}
      </div>

      {/* Table */}
      <div className="retro-card overflow-hidden">
        {/* Header */}
        <div className="flex px-4 py-2 border-b border-[#222] text-[10px] text-muted-foreground">
          <div className="w-10 text-center">#</div>
          <div className="flex-1">Player</div>
          <div className="w-28 text-right">Net Worth</div>
          <div className="w-20 text-right hidden">Cash</div>
          <div className="w-20 text-right hidden">Bank</div>
          <div className="w-20 text-right hidden">Debt</div>
          <div className="w-12 text-right hidden">Day</div>
        </div>

        {/* Entries */}
        {isLoading ? (
          <p role="status" className="px-4 py-8 text-center text-xs text-muted-foreground">Loading scores…</p>
        ) : error ? (
          <div className="px-4 py-8 text-center space-y-4">
            <p role="alert" className="text-xs text-crt-amber">{error}</p>
            <button onClick={() => void load(activeMode, searchQuery)} className="retro-btn min-h-11 px-4 text-xs">TRY AGAIN</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            {isSearching
              ? 'No players found matching your search'
              : 'No scores yet — claim the first spot!'
            }
            {!isSearching && <Link href={activeMode === '30' ? '/game' : '/'} className="retro-btn block w-fit mx-auto mt-4 px-4 py-3">PLAY & POST A SCORE</Link>}
          </div>
        ) : (
          <div className="divide-y divide-[#181818]">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isTop3 = !isSearching && rank <= 3;

              return (
                <div
                  key={entry.id}
                  className="flex items-center px-4 py-2.5 text-xs hover:bg-[#141414] transition-colors"
                >
                  {/* Rank */}
                  <div className="w-10 text-center">
                    {isSearching ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={
                        rank === 1 ? 'text-crt-amber text-glow-amber font-bold' :
                        rank === 2 ? 'text-[#c0c0c0] font-bold' :
                        rank === 3 ? 'text-[#cd7f32] font-bold' :
                        'text-muted-foreground'
                      }>
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Username */}
                  <div className="flex-1 min-w-0 break-words pr-2">
                    <span className={isTop3 ? 'text-crt-green' : 'text-foreground'}>
                      {entry.display_name || entry.username}
                    </span>
                    {entry.is_guest && <span className="block text-[10px] text-muted-foreground">Guest</span>}
                    {entry.display_name && (
                      <span className="text-muted-foreground ml-1">
                        @{entry.username}
                      </span>
                    )}
                  </div>

                  {/* Net Worth */}
                  <div className="w-28 text-right">
                    <span className={`font-bold ${
                      entry.net_worth >= 0 ? 'text-crt-green' : 'text-crt-red'
                    }`}>
                      {formatCurrency(entry.net_worth)}
                    </span>
                  </div>

                  {/* Cash */}
                  <div className="w-20 text-right hidden text-muted-foreground">
                    {formatCurrency(entry.final_cash)}
                  </div>

                  {/* Bank */}
                  <div className="w-20 text-right hidden text-muted-foreground">
                    {formatCurrency(entry.final_bank)}
                  </div>

                  {/* Debt */}
                  <div className="w-20 text-right hidden text-crt-red/70">
                    {entry.final_debt > 0 ? `-${formatCurrency(entry.final_debt)}` : '$0'}
                  </div>

                  {/* Day */}
                  <div className="w-12 text-right hidden text-muted-foreground">
                    {entry.final_day}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Total count */}
      {!error && !isLoading && <div className="text-center text-[10px] text-muted-foreground">
        {isSearching
          ? `${count} result${count !== 1 ? 's' : ''} found`
          : `${count} total scores`
        }
      </div>}
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import { getLeaderboard, searchLeaderboard, type LeaderboardEntry } from '@/actions/leaderboard';
import { formatCurrency } from '@/lib/utils';

const MODES = [
  { value: 'pro_30', label: '30 DAYS' },
  { value: 'pro_45', label: '45 DAYS' },
  { value: 'pro_60', label: '60 DAYS' },
] as const;

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  totalCount: number;
  initialMode?: string;
}

export function LeaderboardClient({ initialEntries, totalCount, initialMode = 'pro_30' }: LeaderboardClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [count, setCount] = useState(totalCount);
  const [activeMode, setActiveMode] = useState(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Request ID to discard stale responses
  const requestIdRef = useRef(0);
  // Debounce timer for search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleModeSwitch = async (mode: string) => {
    if (mode === activeMode) return;
    setActiveMode(mode);
    setSearchQuery('');
    setIsSearching(false);
    setIsLoading(true);

    const reqId = ++requestIdRef.current;

    try {
      const result = await getLeaderboard({ gameMode: mode, page: 1 });
      // Only apply if this is still the latest request
      if (reqId === requestIdRef.current) {
        setEntries(result.entries);
        setCount(result.totalCount);
        setIsLoading(false);
      }
    } catch {
      if (reqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const executeSearch = useCallback(async (query: string, mode: string) => {
    const reqId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      if (query.length < 2) {
        const result = await getLeaderboard({ gameMode: mode, page: 1 });
        if (reqId === requestIdRef.current) {
          setEntries(result.entries);
          setCount(result.totalCount);
          setIsSearching(false);
          setIsLoading(false);
        }
      } else {
        const results = await searchLeaderboard(query, mode);
        if (reqId === requestIdRef.current) {
          setEntries(results);
          setCount(results.length);
          setIsSearching(true);
          setIsLoading(false);
        }
      }
    } catch {
      if (reqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    // Debounce search by 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(query, activeMode);
    }, 300);
  };

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-1">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => handleModeSwitch(mode.value)}
            className={`flex-1 py-2 text-[10px] font-pixel border transition-colors ${
              activeMode === mode.value
                ? 'bg-crt-amber/20 border-crt-amber/50 text-crt-amber'
                : 'bg-transparent border-[#333] text-muted-foreground hover:border-[#555]'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search by username..."
          className="flex-1 bg-[#0a0a0a] border border-[#333] text-xs text-foreground px-3 py-2"
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
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            {searchQuery
              ? 'No players found matching your search'
              : 'No scores yet — be the first to play!'
            }
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
                  <div className="flex-1">
                    <span className={isTop3 ? 'text-crt-green' : 'text-foreground'}>
                      {entry.display_name || entry.username}
                    </span>
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
      <div className="text-center text-[10px] text-muted-foreground">
        {isSearching
          ? `${count} result${count !== 1 ? 's' : ''} found`
          : `${count} total scores`
        }
      </div>
    </div>
  );
}

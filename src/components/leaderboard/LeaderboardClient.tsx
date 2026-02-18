'use client';

import { useState } from 'react';
import { searchLeaderboard, type LeaderboardEntry } from '@/actions/leaderboard';
import { formatCurrency } from '@/lib/utils';

interface LeaderboardClientProps {
  initialEntries: LeaderboardEntry[];
  totalCount: number;
}

export function LeaderboardClient({ initialEntries, totalCount }: LeaderboardClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setEntries(initialEntries);
      return;
    }

    setIsSearching(true);
    const results = await searchLeaderboard(query);
    setEntries(results);
    setIsSearching(false);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by username..."
          className="flex-1 bg-[#0a0a0a] border border-[#333] text-xs text-foreground px-3 py-2"
        />
        {isSearching && (
          <span className="text-xs text-muted-foreground self-center">Searching...</span>
        )}
      </div>

      {/* Table */}
      <div className="retro-card overflow-hidden">
        {/* Header */}
        <div className="flex px-4 py-2 border-b border-[#222] text-[10px] text-muted-foreground">
          <div className="w-10 text-center">#</div>
          <div className="flex-1">Player</div>
          <div className="w-28 text-right">Net Worth</div>
          <div className="w-20 text-right hidden md:block">Cash</div>
          <div className="w-20 text-right hidden md:block">Bank</div>
          <div className="w-20 text-right hidden md:block">Debt</div>
          <div className="w-12 text-right hidden sm:block">Day</div>
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
              const isTop3 = rank <= 3;

              return (
                <div
                  key={entry.id}
                  className="flex items-center px-4 py-2.5 text-xs hover:bg-[#141414] transition-colors"
                >
                  {/* Rank */}
                  <div className="w-10 text-center">
                    <span className={
                      rank === 1 ? 'text-crt-amber text-glow-amber font-bold' :
                      rank === 2 ? 'text-[#c0c0c0] font-bold' :
                      rank === 3 ? 'text-[#cd7f32] font-bold' :
                      'text-muted-foreground'
                    }>
                      {rank}
                    </span>
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
                  <div className="w-20 text-right hidden md:block text-muted-foreground">
                    {formatCurrency(entry.final_cash)}
                  </div>

                  {/* Bank */}
                  <div className="w-20 text-right hidden md:block text-muted-foreground">
                    {formatCurrency(entry.final_bank)}
                  </div>

                  {/* Debt */}
                  <div className="w-20 text-right hidden md:block text-crt-red/70">
                    {entry.final_debt > 0 ? `-${formatCurrency(entry.final_debt)}` : '$0'}
                  </div>

                  {/* Day */}
                  <div className="w-12 text-right hidden sm:block text-muted-foreground">
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
        {totalCount} total scores
      </div>
    </div>
  );
}

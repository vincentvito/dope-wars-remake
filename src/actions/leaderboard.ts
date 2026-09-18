'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { isLeaderboardMode } from '@/lib/leaderboard';

export interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string | null;
  net_worth: number;
  final_cash: number;
  final_bank: number;
  final_debt: number;
  final_day: number;
  game_mode: string;
  created_at: string;
  is_guest: boolean;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  totalCount: number;
  error?: string;
}

export async function getLeaderboard(options: {
  gameMode?: string;
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<LeaderboardResult> {
  const unavailable = { entries: [], totalCount: 0, error: 'The leaderboard is temporarily unavailable. Please try again.' };
  if (!isSupabaseConfigured()) {
    return unavailable;
  }

  try {
    const supabase = await createClient();
    const { gameMode = '30', page = 1, pageSize = 50, search } = options;
    if (!isLeaderboardMode(gameMode) || !Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return { entries: [], totalCount: 0, error: 'Invalid leaderboard request.' };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('leaderboard')
      .select('id, username, display_name, net_worth, final_cash, final_bank, final_debt, final_day, game_mode, created_at, is_guest', { count: 'exact' })
      .eq('game_mode', gameMode)
      .eq('validated', true)
      .order('net_worth', { ascending: false })
      .order('created_at', { ascending: true })
      .range(from, to);
    if (search) query = query.ilike('username', `%${search.slice(0, 20).replace(/[\\%_]/g, '\\$&')}%`);

    const { data, count, error } = await query;

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return unavailable;
    }

    return {
      entries: (data ?? []) as LeaderboardEntry[],
      totalCount: count ?? 0,
    };
  } catch {
    console.error('Leaderboard service unavailable');
    return unavailable;
  }
}

export async function searchLeaderboard(query: string, gameMode: string = '30'): Promise<LeaderboardResult> {
  return getLeaderboard({ gameMode, search: query, pageSize: 20 });
}

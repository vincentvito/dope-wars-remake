'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

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
}

export async function getLeaderboard(options: {
  gameMode?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{
  entries: LeaderboardEntry[];
  totalCount: number;
}> {
  if (!isSupabaseConfigured()) {
    return { entries: [], totalCount: 0 };
  }

  const supabase = await createClient();
  const { gameMode = '30', page = 1, pageSize = 50 } = options;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('leaderboard')
    .select('*', { count: 'exact' })
    .eq('game_mode', gameMode)
    .eq('validated', true)
    .order('net_worth', { ascending: false })
    .order('created_at', { ascending: true })
    .range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Leaderboard fetch error:', error);
    return { entries: [], totalCount: 0 };
  }

  return {
    entries: (data ?? []) as LeaderboardEntry[],
    totalCount: count ?? 0,
  };
}

export async function searchLeaderboard(query: string, gameMode: string = '30') {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('game_mode', gameMode)
    .eq('validated', true)
    .ilike('username', `%${query}%`)
    .order('net_worth', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Leaderboard search error:', error);
    return [];
  }

  return (data ?? []) as LeaderboardEntry[];
}

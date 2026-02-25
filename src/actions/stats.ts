'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface UserStats {
  gamesPlayed: number;
  avgNetWorth: number;
  bestTradeProfit: number;
  bestTradeDrug: string | null;
  worstTradeLoss: number;
  worstTradeDrug: string | null;
  mostTradedDrug: string | null;
  mostTradedDrugCount: number;
  biggestMugging: number;
}

export async function getUserStats(): Promise<{ stats: UserStats | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { stats: null, error: 'Not configured' };
  }

  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { stats: null, error: 'Authentication required' };
  }

  // Check PRO status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single();

  if (!profile?.is_pro) {
    return { stats: null, error: 'PRO required' };
  }

  // Fetch completed game sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('game_sessions')
    .select('final_net_worth, best_trade_profit, best_trade_drug, worst_trade_loss, worst_trade_drug, drug_trade_counts, biggest_mugging')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  if (sessionsError || !sessions) {
    return { stats: null, error: 'Failed to load stats' };
  }

  if (sessions.length === 0) {
    return {
      stats: {
        gamesPlayed: 0,
        avgNetWorth: 0,
        bestTradeProfit: 0,
        bestTradeDrug: null,
        worstTradeLoss: 0,
        worstTradeDrug: null,
        mostTradedDrug: null,
        mostTradedDrugCount: 0,
        biggestMugging: 0,
      },
    };
  }

  // Aggregate stats across all sessions
  let totalNetWorth = 0;
  let bestTradeProfit = 0;
  let bestTradeDrug: string | null = null;
  let worstTradeLoss = 0;
  let worstTradeDrug: string | null = null;
  let biggestMugging = 0;
  const aggregatedDrugCounts: Record<string, number> = {};

  for (const session of sessions) {
    totalNetWorth += session.final_net_worth ?? 0;

    if ((session.best_trade_profit ?? 0) > bestTradeProfit) {
      bestTradeProfit = session.best_trade_profit ?? 0;
      bestTradeDrug = session.best_trade_drug ?? null;
    }

    if ((session.worst_trade_loss ?? 0) > worstTradeLoss) {
      worstTradeLoss = session.worst_trade_loss ?? 0;
      worstTradeDrug = session.worst_trade_drug ?? null;
    }

    if ((session.biggest_mugging ?? 0) > biggestMugging) {
      biggestMugging = session.biggest_mugging ?? 0;
    }

    // Merge drug trade counts
    const counts = (session.drug_trade_counts ?? {}) as Record<string, number>;
    for (const [drug, count] of Object.entries(counts)) {
      aggregatedDrugCounts[drug] = (aggregatedDrugCounts[drug] ?? 0) + count;
    }
  }

  // Find most traded drug
  let mostTradedDrug: string | null = null;
  let mostTradedDrugCount = 0;
  for (const [drug, count] of Object.entries(aggregatedDrugCounts)) {
    if (count > mostTradedDrugCount) {
      mostTradedDrug = drug;
      mostTradedDrugCount = count;
    }
  }

  return {
    stats: {
      gamesPlayed: sessions.length,
      avgNetWorth: Math.round(totalNetWorth / sessions.length),
      bestTradeProfit,
      bestTradeDrug,
      worstTradeLoss,
      worstTradeDrug,
      mostTradedDrug,
      mostTradedDrugCount,
      biggestMugging,
    },
  };
}

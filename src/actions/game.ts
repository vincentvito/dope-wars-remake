'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { assertRun, MAX_SAVE_BYTES } from '@/engine/validation';
import { restoreGame, serializeGame } from '@/engine/saved-game';
import { replayGame } from '@/engine/replay';
import { replayProGame } from '@/engine/pro-replay';
import { isProMode } from '@/engine/pro-game';
import type { PlayerAction, ProPlayerAction, GameMode } from '@/engine/types';

export async function submitGameScore(input: {
  seed: string;
  gameMode: GameMode;
  actions: (PlayerAction | ProPlayerAction)[];
}) {
  try { assertRun(input); if (JSON.stringify(input).length > MAX_SAVE_BYTES) throw new Error(); }
  catch { return { error: 'Invalid game data' }; }
  const supabase = await createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Authentication required to submit scores' };
  }

  // 2. Gate: Classic mode has no leaderboard, pro modes require Pro status
  if (input.gameMode === '30') {
    return { error: 'Leaderboard is only available for Pro game modes' };
  }

  // Fetch profile once — used for both Pro check and leaderboard entry
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, username, display_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found' };
  }

  if (isProMode(input.gameMode) && !profile.is_pro) {
    return { error: 'Pro membership required to submit scores' };
  }

  // 3. Replay the game server-side to validate the score (with stats collection in single pass)
  const result = isProMode(input.gameMode)
    ? replayProGame(input.seed, input.gameMode, input.actions as ProPlayerAction[], true)
    : replayGame(input.seed, input.gameMode, input.actions as PlayerAction[], true);

  if (!result.valid || !result.completed) {
    return { error: 'Game validation failed' };
  }

  // 4. Use service client to write to leaderboard (bypasses RLS)
  const serviceClient = await createServiceClient();

  // Trade stats were collected during the replay pass above
  const tradeStats = result.tradeStats ?? {
    bestTradeProfit: 0, bestTradeDrug: null,
    worstTradeLoss: 0, worstTradeDrug: null,
    drugTradeCounts: {}, biggestMugging: 0,
  };

  // One transaction serializes repeat submissions and writes both records together.
  const { error: submissionError } = await serviceClient.rpc('record_game_score', {
    payload: {
      user_id: user.id, seed: input.seed, game_mode: input.gameMode, action_log: input.actions,
      final_cash: result.finalCash, final_bank: result.finalBank, final_debt: result.finalDebt,
      final_inventory_value: result.finalInventoryValue, final_net_worth: result.finalNetWorth,
      final_day: result.finalDay, username: profile.username, display_name: profile.display_name,
      best_trade_profit: tradeStats.bestTradeProfit, best_trade_drug: tradeStats.bestTradeDrug,
      worst_trade_loss: tradeStats.worstTradeLoss, worst_trade_drug: tradeStats.worstTradeDrug,
      drug_trade_counts: tradeStats.drugTradeCounts, biggest_mugging: tradeStats.biggestMugging,
    },
  });
  if (submissionError) return { error: 'Failed to save score. Please try again.' };

  return {
    success: true,
    netWorth: result.finalNetWorth,
  };
}

export async function saveGameProgress(stateBlob: string, seed: string, gameMode: GameMode) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' };

  let parsedState;
  try {
    if (typeof stateBlob !== 'string' || stateBlob.length > MAX_SAVE_BYTES) throw new Error();
    const state = restoreGame(stateBlob);
    if (state.seed !== seed || state.gameMode !== gameMode || state.phase === 'game_over') throw new Error();
    parsedState = JSON.parse(serializeGame(state));
  } catch {
    return { error: 'Invalid state data' };
  }

  // Check for existing active session to update
  const { data: existing } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Update existing session
    const { error } = await supabase
      .from('game_sessions')
      .update({
        seed,
        game_mode: gameMode,
        state_blob: parsedState,
      })
      .eq('id', existing.id);

    if (error) return { error: 'Failed to save progress' };
  } else {
    // Create new session
    const { error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        seed,
        game_mode: gameMode,
        state_blob: parsedState,
        status: 'active',
      });

    if (error) return { error: 'Failed to save progress' };
  }

  return { success: true };
}

export async function loadGameProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('game_sessions')
    .select('state_blob')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.state_blob ?? null;
}

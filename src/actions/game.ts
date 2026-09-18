'use server';

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { normalizeNickname } from '@/lib/leaderboard';
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
  nickname?: string;
}) {
  try { assertRun(input); if (JSON.stringify(input).length > MAX_SAVE_BYTES) throw new Error(); }
  catch { return { error: 'Invalid game data' }; }
  if (!isSupabaseConfigured()) return { error: 'Score saving is temporarily unavailable. Keep this result open and try again later.' };
  try {
    const supabase = await createClient();

    // Classic accepts guests; Pro still requires a signed-in Pro account.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && isProMode(input.gameMode)) {
      return { error: 'Sign in to your Pro account to submit this score.' };
    }

    let username: string;
    let displayName: string | null = null;
    if (user) {
      const { data: profile } = await supabase.from('profiles')
        .select('is_pro, username, display_name').eq('id', user.id).single();
      if (!profile) return { error: 'Profile not found. Please sign in again.' };
      if (isProMode(input.gameMode) && !profile.is_pro) {
        return { error: 'Pro membership required to submit scores' };
      }
      username = profile.username;
      displayName = profile.display_name;
    } else {
      const nickname = normalizeNickname(input.nickname);
      if (!nickname) return { error: 'Choose a nickname with 3–20 letters, numbers, hyphens or underscores.' };
      username = nickname;
    }

    // 3. Replay the game server-side to validate the score (with stats collection in single pass)
    const result = isProMode(input.gameMode)
      ? replayProGame(input.seed, input.gameMode, input.actions as ProPlayerAction[], true)
      : replayGame(input.seed, input.gameMode, input.actions as PlayerAction[], true);

    if (!result.valid || !result.completed) {
      return { error: 'Game validation failed' };
    }

    // Kept out of the public leaderboard. The cookie makes retries idempotent
    // and lets the database limit guest submissions without collecting an email.
    let guestId: string | null = null;
    if (!user) {
      const cookieStore = await cookies();
      const existing = cookieStore.get('dope-wars-guest')?.value;
      guestId = existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing) ? existing : randomUUID();
      cookieStore.set('dope-wars-guest', guestId, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365,
      });
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
        user_id: user?.id ?? null, guest_id: guestId, seed: input.seed, game_mode: input.gameMode, action_log: input.actions,
        final_cash: result.finalCash, final_bank: result.finalBank, final_debt: result.finalDebt,
        final_inventory_value: result.finalInventoryValue, final_net_worth: result.finalNetWorth,
        final_day: result.finalDay, username, display_name: displayName,
        best_trade_profit: tradeStats.bestTradeProfit, best_trade_drug: tradeStats.bestTradeDrug,
        worst_trade_loss: tradeStats.worstTradeLoss, worst_trade_drug: tradeStats.worstTradeDrug,
        drug_trade_counts: tradeStats.drugTradeCounts, biggest_mugging: tradeStats.biggestMugging,
      },
    });
    if (submissionError) {
      console.error('Score save failed:', submissionError.code);
      return { error: submissionError.message === 'guest_score_limit'
        ? 'You have posted 10 scores in the past hour. Please try again later; keep this result open to try again.'
        : 'Failed to save score. Keep this result open and try again.' };
    }

    return {
      success: true,
      netWorth: result.finalNetWorth,
    };
  } catch {
    console.error('Score submission service unavailable');
    return { error: 'Score saving is temporarily unavailable. Keep this result open and try again later.' };
  }
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

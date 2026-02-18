'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { replayGame } from '@/engine/replay';
import { replayProGame } from '@/engine/pro-replay';
import { isProMode } from '@/engine/pro-game';
import type { PlayerAction, ProPlayerAction, GameMode } from '@/engine/types';

export async function submitGameScore(input: {
  seed: string;
  gameMode: GameMode;
  actions: (PlayerAction | ProPlayerAction)[];
}) {
  const supabase = await createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Authentication required to submit scores' };
  }

  // 2. Replay the game server-side to validate the score
  const result = isProMode(input.gameMode)
    ? replayProGame(input.seed, input.gameMode, input.actions as ProPlayerAction[])
    : replayGame(input.seed, input.gameMode, input.actions as PlayerAction[]);

  if (!result.valid) {
    return { error: `Game validation failed: ${result.error}` };
  }

  // 3. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found' };
  }

  // 4. Use service client to write to leaderboard (bypasses RLS)
  const serviceClient = await createServiceClient();

  // Create game session record
  const { data: session, error: sessionError } = await serviceClient
    .from('game_sessions')
    .insert({
      user_id: user.id,
      seed: input.seed,
      game_mode: input.gameMode,
      action_log: input.actions,
      final_cash: result.finalCash,
      final_bank: result.finalBank,
      final_debt: result.finalDebt,
      final_inventory_value: result.finalInventoryValue,
      final_net_worth: result.finalNetWorth,
      final_day: result.finalDay,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    return { error: 'Failed to save game session' };
  }

  // 5. Insert validated leaderboard entry
  const { error: leaderboardError } = await serviceClient
    .from('leaderboard')
    .insert({
      user_id: user.id,
      game_session_id: session.id,
      username: profile.username,
      display_name: profile.display_name,
      net_worth: result.finalNetWorth,
      final_cash: result.finalCash,
      final_bank: result.finalBank,
      final_debt: result.finalDebt,
      final_day: result.finalDay,
      game_mode: input.gameMode,
      validated: true,
    });

  if (leaderboardError) {
    return { error: 'Failed to write leaderboard entry' };
  }

  return {
    success: true,
    netWorth: result.finalNetWorth,
  };
}

export async function saveGameProgress(stateBlob: string, seed: string, gameMode: GameMode) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' };

  // Upsert: update existing active session or create new one
  const { error } = await supabase
    .from('game_sessions')
    .upsert(
      {
        user_id: user.id,
        seed,
        game_mode: gameMode,
        state_blob: JSON.parse(stateBlob),
        status: 'active',
      },
      {
        onConflict: 'id',
      }
    );

  if (error) return { error: 'Failed to save progress' };
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
    .single();

  return data?.state_blob ?? null;
}

import { assertRun } from './validation';
import { createNewGame, applyAction, calculateNetWorth } from './game';
import type { PlayerAction, GameMode } from './types';
import { emptyStats, collectActionStats, type GameTradeStats } from './stats-extractor';

export interface ReplayResult {
  valid: boolean;
  completed?: boolean;
  finalNetWorth: number;
  finalDay: number;
  finalCash: number;
  finalBank: number;
  finalDebt: number;
  finalInventoryValue: number;
  tradeStats?: GameTradeStats;
  error?: string;
}

/**
 * Replay a complete game from seed + action log.
 * Used server-side to validate scores before writing to the leaderboard.
 *
 * Because the engine is fully deterministic (seeded RNG, pure functions),
 * replaying the same seed + actions always produces the same final state.
 *
 * When withStats is true, trade statistics are collected during the same
 * pass, avoiding a second full replay via extractStats.
 */
export function replayGame(
  seed: string,
  gameMode: GameMode,
  actions: PlayerAction[],
  withStats = false
): ReplayResult {
  try {
    assertRun({ seed, gameMode, actions });
    let state = createNewGame(seed, gameMode);
    const stats = withStats ? emptyStats() : undefined;

    for (const action of actions) {
      if (stats) collectActionStats(state, action, stats);
      state = applyAction(state, action, false);
    }

    const netWorth = calculateNetWorth(state);
    const inventoryValue = state.inventory.reduce((sum, slot) => {
      const price = state.market[slot.drug] ?? slot.avgBuyPrice;
      return sum + price * slot.quantity;
    }, 0);

    return {
      valid: true,
      completed: state.phase === 'game_over',
      finalNetWorth: netWorth,
      finalDay: state.currentDay,
      finalCash: state.cash,
      finalBank: state.bank,
      finalDebt: state.debt,
      finalInventoryValue: inventoryValue,
      tradeStats: stats,
    };
  } catch (error) {
    return {
      valid: false,
      finalNetWorth: 0,
      finalDay: 0,
      finalCash: 0,
      finalBank: 0,
      finalDebt: 0,
      finalInventoryValue: 0,
      error: error instanceof Error ? error.message : 'Unknown replay error',
    };
  }
}

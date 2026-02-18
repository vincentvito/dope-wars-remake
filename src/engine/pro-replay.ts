import { createProGame, applyProAction, calculateProNetWorth } from './pro-game';
import type { ProPlayerAction, GameMode } from './types';

export interface ProReplayResult {
  valid: boolean;
  finalNetWorth: number;
  finalDay: number;
  finalCash: number;
  finalBank: number;
  finalDebt: number;
  finalInventoryValue: number;
  error?: string;
}

/**
 * Replay a complete Pro game from seed + action log.
 * Used server-side to validate scores before writing to the leaderboard.
 *
 * Deterministic: same seed + actions always produces the same final state.
 */
export function replayProGame(
  seed: string,
  gameMode: GameMode,
  actions: ProPlayerAction[]
): ProReplayResult {
  try {
    let state = createProGame(seed, gameMode);

    for (const action of actions) {
      state = applyProAction(state, action);
    }

    const netWorth = calculateProNetWorth(state);
    const inventoryValue = state.inventory.reduce((sum, slot) => {
      const price = state.market[slot.drug] ?? slot.avgBuyPrice;
      return sum + price * slot.quantity;
    }, 0);

    return {
      valid: true,
      finalNetWorth: netWorth,
      finalDay: state.currentDay,
      finalCash: state.cash,
      finalBank: state.bank,
      finalDebt: state.debt,
      finalInventoryValue: inventoryValue,
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

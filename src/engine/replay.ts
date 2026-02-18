import { createNewGame, applyAction, calculateNetWorth } from './game';
import type { PlayerAction, GameMode } from './types';

export interface ReplayResult {
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
 * Replay a complete game from seed + action log.
 * Used server-side to validate scores before writing to the leaderboard.
 *
 * Because the engine is fully deterministic (seeded RNG, pure functions),
 * replaying the same seed + actions always produces the same final state.
 */
export function replayGame(
  seed: string,
  gameMode: GameMode,
  actions: PlayerAction[]
): ReplayResult {
  try {
    let state = createNewGame(seed, gameMode);

    for (const action of actions) {
      state = applyAction(state, action);
    }

    const netWorth = calculateNetWorth(state);
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

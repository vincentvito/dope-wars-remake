import { createNewGame, applyAction } from './game';
import { createProGame, applyProAction, isProMode } from './pro-game';
import type { PlayerAction, ProPlayerAction, GameMode, GameState, ProGameState } from './types';

export interface GameTradeStats {
  bestTradeProfit: number;
  bestTradeDrug: string | null;
  worstTradeLoss: number; // stored as positive
  worstTradeDrug: string | null;
  drugTradeCounts: Record<string, number>;
  biggestMugging: number;
}

export function emptyStats(): GameTradeStats {
  return {
    bestTradeProfit: 0,
    bestTradeDrug: null,
    worstTradeLoss: 0,
    worstTradeDrug: null,
    drugTradeCounts: {},
    biggestMugging: 0,
  };
}

/**
 * Extract trade-level statistics by replaying a classic game.
 */
export function extractGameStats(
  seed: string,
  gameMode: GameMode,
  actions: PlayerAction[]
): GameTradeStats {
  const stats = emptyStats();

  try {
    let state = createNewGame(seed, gameMode);

    for (const action of actions) {
      collectActionStats(state, action, stats);
      state = applyAction(state, action);
    }
  } catch {
    // If replay fails, return whatever stats we collected so far
  }

  return stats;
}

/**
 * Extract trade-level statistics by replaying a Pro game.
 */
export function extractProGameStats(
  seed: string,
  gameMode: GameMode,
  actions: ProPlayerAction[]
): GameTradeStats {
  const stats = emptyStats();

  try {
    let state: ProGameState = createProGame(seed, gameMode);

    for (const action of actions) {
      collectActionStats(state, action, stats);

      // Celebrity buyer events count as trades when accepted
      if (
        action.type === 'EVENT_ACCEPT' &&
        state.activeEvent?.type === 'celebrity_buyer' &&
        state.activeEvent.drug &&
        state.activeEvent.quantity
      ) {
        const slot = state.inventory.find((s) => s.drug === state.activeEvent!.drug);
        if (slot) {
          const sellQty = Math.min(state.activeEvent.quantity, slot.quantity);
          const unitPrice = state.activeEvent.unitPrice ?? state.market[state.activeEvent.drug] ?? slot.avgBuyPrice;
          const sellPrice = unitPrice * 3;
          const profit = (sellPrice - slot.avgBuyPrice) * sellQty;

          if (profit > stats.bestTradeProfit) {
            stats.bestTradeProfit = profit;
            stats.bestTradeDrug = state.activeEvent.drug;
          }
          if (profit < 0 && Math.abs(profit) > stats.worstTradeLoss) {
            stats.worstTradeLoss = Math.abs(profit);
            stats.worstTradeDrug = state.activeEvent.drug;
          }
        }
      }

      state = applyProAction(state, action);
    }
  } catch {
    // If replay fails, return whatever stats we collected so far
  }

  return stats;
}

/**
 * Collect stats from a single action, inspecting state before the action is applied.
 */
export function collectActionStats(
  state: GameState | ProGameState,
  action: PlayerAction | ProPlayerAction,
  stats: GameTradeStats
): void {
  // Track SELL profit/loss
  if (action.type === 'SELL') {
    const slot = state.inventory.find((s) => s.drug === action.drug);
    const marketPrice = state.market[action.drug];
    if (slot && marketPrice != null) {
      const profit = (marketPrice - slot.avgBuyPrice) * action.quantity;
      if (profit > stats.bestTradeProfit) {
        stats.bestTradeProfit = profit;
        stats.bestTradeDrug = action.drug;
      }
      if (profit < 0 && Math.abs(profit) > stats.worstTradeLoss) {
        stats.worstTradeLoss = Math.abs(profit);
        stats.worstTradeDrug = action.drug;
      }
    }
  }

  // Track drug trade quantities
  if (action.type === 'BUY' || action.type === 'SELL') {
    stats.drugTradeCounts[action.drug] =
      (stats.drugTradeCounts[action.drug] ?? 0) + action.quantity;
  }

  // Track mugging losses (only when player accepts the event)
  if (
    action.type === 'EVENT_ACCEPT' &&
    state.activeEvent?.type === 'mugging' &&
    state.activeEvent.cashChange != null
  ) {
    const loss = Math.abs(state.activeEvent.cashChange);
    if (loss > stats.biggestMugging) {
      stats.biggestMugging = loss;
    }
  }
}

/**
 * Unified extractor that handles both classic and pro modes.
 */
export function extractStats(
  seed: string,
  gameMode: GameMode,
  actions: (PlayerAction | ProPlayerAction)[]
): GameTradeStats {
  if (isProMode(gameMode)) {
    return extractProGameStats(seed, gameMode, actions as ProPlayerAction[]);
  }
  return extractGameStats(seed, gameMode, actions as PlayerAction[]);
}

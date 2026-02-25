import { createProGame, applyProAction, calculateProNetWorth } from './pro-game';
import type { ProPlayerAction, GameMode } from './types';
import { emptyStats, collectActionStats, type GameTradeStats } from './stats-extractor';

export interface ProReplayResult {
  valid: boolean;
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
 * Replay a complete Pro game from seed + action log.
 * Used server-side to validate scores before writing to the leaderboard.
 *
 * Deterministic: same seed + actions always produces the same final state.
 *
 * When withStats is true, trade statistics are collected during the same
 * pass, avoiding a second full replay via extractStats.
 */
export function replayProGame(
  seed: string,
  gameMode: GameMode,
  actions: ProPlayerAction[],
  withStats = false
): ProReplayResult {
  try {
    let state = createProGame(seed, gameMode);
    const stats = withStats ? emptyStats() : undefined;

    for (const action of actions) {
      if (stats) {
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
      }
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

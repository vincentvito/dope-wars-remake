import { describe, it, expect } from 'vitest';
import { replayProGame } from '../pro-replay';
import { createProGame, applyProAction } from '../pro-game';
import type { ProPlayerAction, DrugName } from '../types';

const TEST_SEED = 'pro-replay-test-seed';

describe('replayProGame', () => {
  it('replays a game and produces the same final state', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    const actions: ProPlayerAction[] = [];

    // Buy something if possible
    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = Math.min(Math.floor(state.cash / price), state.trenchcoatSpace);
    if (maxQty > 0) {
      const action: ProPlayerAction = { type: 'BUY', drug, quantity: Math.min(maxQty, 3) };
      actions.push(action);
      state = applyProAction(state, action);
    }

    // Travel
    const travelAction: ProPlayerAction = { type: 'TRAVEL', destination: 'Manhattan' };
    actions.push(travelAction);
    state = applyProAction(state, travelAction);

    // Replay
    const result = replayProGame(TEST_SEED, 'pro_30', actions);

    expect(result.valid).toBe(true);
    expect(result.finalDay).toBe(state.currentDay);
    expect(result.finalCash).toBe(state.cash);
    expect(result.finalDebt).toBe(state.debt);
  });

  it('detects invalid action sequences', () => {
    const result = replayProGame(TEST_SEED, 'pro_30', [
      { type: 'SELL', drug: 'Cocaine', quantity: 100 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('is deterministic — same seed + actions = same result', () => {
    const actions: ProPlayerAction[] = [
      { type: 'BANK_DEPOSIT', amount: 500 },
      { type: 'TRAVEL', destination: 'Manhattan' },
    ];

    const result1 = replayProGame(TEST_SEED, 'pro_30', actions);
    const result2 = replayProGame(TEST_SEED, 'pro_30', actions);

    expect(result1).toEqual(result2);
  });

  it('replays a game with basic travel', () => {
    const basicActions: ProPlayerAction[] = [
      { type: 'TRAVEL', destination: 'Manhattan' },
    ];

    const result = replayProGame(TEST_SEED, 'pro_30', basicActions);
    expect(result.valid).toBe(true);
    expect(result.finalDay).toBe(2);
  });

  it('handles empty action list', () => {
    const result = replayProGame(TEST_SEED, 'pro_30', []);

    expect(result.valid).toBe(true);
    expect(result.finalDay).toBe(1);
  });
});

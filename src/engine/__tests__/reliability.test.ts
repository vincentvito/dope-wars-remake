import { describe, it, expect } from 'vitest';
import { applyAction, createNewGame } from '../game';
import { applyProAction, createProGame } from '../pro-game';
import { replayGame } from '../replay';
import { replayProGame } from '../pro-replay';
import { restoreGame, serializeGame, SAVE_VERSION } from '../saved-game';
import { MAX_ACTIONS, assertRun } from '../validation';
import { selectLoadout } from '../armory';
import type { GameState, PlayerAction, ProGameState, ProPlayerAction } from '../types';

const seed = 'reliability-regression';

describe('untrusted actions', () => {
  it.each([NaN, Infinity, -Infinity, 0, -1, 1.5, '10', null, undefined, Number.MAX_SAFE_INTEGER + 1])('rejects invalid numeric value %s in both engines', value => {
    for (const type of ['BANK_DEPOSIT', 'BANK_WITHDRAW', 'PAY_DEBT', 'BUY', 'SELL']) {
      const action = { type, drug: 'Ecstasy', quantity: value, amount: value } as PlayerAction;
      expect(() => applyAction(createNewGame(seed), action)).toThrow();
      expect(() => applyProAction(createProGame(seed, 'pro_30'), action)).toThrow();
    }
  });
  it('rejects unknown modes, drugs, locations and oversized histories', () => {
    for (const action of [{ type: 'BUY', drug: '__proto__', quantity: 1 }, { type: 'TRAVEL', destination: 'Mars' }, null]) {
      expect(() => applyAction(createNewGame(seed), action as PlayerAction)).toThrow();
    }
    expect(() => assertRun({ seed, gameMode: 'pro_free', actions: [] })).toThrow();
    expect(() => assertRun({ seed, gameMode: '30', actions: Array(MAX_ACTIONS + 1).fill({ type: 'COMBAT_RUN' }) })).toThrow();
  });
  it('rejects locked international travel even when cash is sufficient', () => {
    const state = { ...createProGame(seed, 'pro_30'), cash: 1_000_000 };
    expect(() => applyProAction(state, { type: 'TRAVEL', destination: 'Medellin' })).toThrow(/locked/);
  });
  it('cannot skip negative events', () => {
    const state: GameState = { ...createNewGame(seed), phase: 'event', activeEvent: { type: 'mugging', message: 'Mugged', cashChange: -500 } };
    expect(() => applyAction(state, { type: 'EVENT_DECLINE' })).toThrow();
    expect(applyAction(state, { type: 'EVENT_ACCEPT' }).cash).toBe(1500);
  });
  it('cannot select the same weapon twice', () => {
    const state = { ...createProGame(seed, 'pro_30'), proCombat: { selectedLoadout: [] }, armory: [{ name: 'Pistol', tier: 'Pistol', foundDay: 1 }] } as unknown as ProGameState;
    expect(() => selectLoadout(state, [0, 0])).toThrow(/once/);
    expect(() => selectLoadout(state, [0.5])).toThrow();
  });
});

describe('finances and completion', () => {
  it.each(['30', 'pro_30'] as const)('pays documented bank interest, including after debt is paid: %s', mode => {
    const state = { ...(mode === '30' ? createNewGame(seed) : createProGame(seed, mode)), bank: 1000, debt: 0 };
    const action = { type: 'TRAVEL', destination: 'Manhattan' } as const;
    const next = mode === '30' ? applyAction(state as GameState, action) : applyProAction(state as ProGameState, action);
    expect(next.bank).toBe(1050);
    expect(next.debt).toBe(0);
  });
  it('ends Pro at the day limit even with a pending reputation event', () => {
    const state: ProGameState = { ...createProGame(seed, 'pro_30'), currentDay: 30, pendingReputationPenalty: { drug: 'Cocaine', cutPercentage: 25 } };
    const next = applyProAction(state, { type: 'TRAVEL', destination: 'Manhattan' });
    expect(next.phase).toBe('game_over');
    expect(next.activeEvent).toBeNull();
  });
  it('marks partial replays incomplete and completed replays complete', () => {
    expect(replayGame(seed, '30', []).completed).toBe(false);
    expect(replayProGame(seed, 'pro_30', []).completed).toBe(false);
    let state = createNewGame(seed);
    for (let i = 0; state.phase !== 'game_over' && i < 200; i++) state = applyAction(state, nextAction(state) as PlayerAction);
    const result = replayGame(seed, '30', state.actionLog, true);
    expect(result.valid).toBe(true);
    expect(result.completed).toBe(true);
    expect(result.finalCash).toBe(state.cash);
  });
});

function nextAction(state: GameState | ProGameState): ProPlayerAction {
  if (state.phase === 'event') return { type: 'EVENT_ACCEPT' };
  if (state.phase === 'combat') return { type: 'COMBAT_RUN' };
  return { type: 'TRAVEL', destination: state.currentDistrict === 'Bronx' ? 'Manhattan' : 'Bronx' };
}

describe('versioned saves', () => {
  it.each(['30', 'pro_30', 'pro_45', 'pro_60'] as const)('restores every transition exactly for %s', mode => {
    let state: GameState | ProGameState = mode === '30' ? createNewGame(seed) : createProGame(seed, mode);
    for (let i = 0; i < 200; i++) {
      expect(restoreGame(serializeGame(state))).toEqual(state);
      if (state.phase === 'game_over') break;
      state = mode === '30' ? applyAction(state as GameState, nextAction(state) as PlayerAction) : applyProAction(state as ProGameState, nextAction(state));
    }
    expect(state.phase).toBe('game_over');
  });
  it('rejects corrupt and incompatible saves and ignores injected balances', () => {
    for (const saved of ['broken', 'null', '{}', JSON.stringify({ version: -1, seed, gameMode: '30', actions: [] })]) expect(() => restoreGame(saved)).toThrow();
    const state = restoreGame(JSON.stringify({ version: SAVE_VERSION, seed, gameMode: '30', actions: [], cash: 999999 }));
    expect(state.cash).toBe(2000);
  });
});

import { describe, it, expect } from 'vitest';
import { createNewGame, applyAction, calculateNetWorth, getUsedInventorySpace } from '../game';
import { replayGame } from '../replay';
import { getMaxBuyQuantity } from '../inventory';
import type { PlayerAction, DrugName } from '../types';
import { STARTING_CASH, STARTING_DEBT, STARTING_HEALTH, STARTING_TRENCHCOAT_SPACE } from '../constants';

const TEST_SEED = 'test-game-seed-123';

describe('createNewGame', () => {
  it('creates a game with correct starting state', () => {
    const state = createNewGame(TEST_SEED);

    expect(state.seed).toBe(TEST_SEED);
    expect(state.gameMode).toBe('30');
    expect(state.currentDay).toBe(1);
    expect(state.maxDays).toBe(31);
    expect(state.currentDistrict).toBe('Bronx');
    expect(state.cash).toBe(STARTING_CASH);
    expect(state.bank).toBe(0);
    expect(state.debt).toBe(STARTING_DEBT);
    expect(state.health).toBe(STARTING_HEALTH);
    expect(state.trenchcoatSpace).toBe(STARTING_TRENCHCOAT_SPACE);
    expect(state.guns).toBe(0);
    expect(state.inventory).toEqual([]);
    expect(state.phase).toBe('market');
    expect(state.actionLog).toEqual([]);
  });

  it('generates market prices on creation', () => {
    const state = createNewGame(TEST_SEED);

    // Should have some drugs available
    const availableDrugs = Object.keys(state.market);
    expect(availableDrugs.length).toBeGreaterThan(0);

    // All prices should be positive numbers
    for (const price of Object.values(state.market)) {
      expect(price).toBeGreaterThan(0);
    }
  });

  it('is deterministic — same seed produces same state', () => {
    const state1 = createNewGame(TEST_SEED);
    const state2 = createNewGame(TEST_SEED);

    expect(state1.market).toEqual(state2.market);
    expect(state1.marketEvents).toEqual(state2.marketEvents);
  });

  it('supports different game modes', () => {
    const game30 = createNewGame(TEST_SEED, '30');

    expect(game30.maxDays).toBe(31);
  });
});

describe('applyAction - BUY/SELL', () => {
  it('allows buying an available drug', () => {
    const state = createNewGame(TEST_SEED);

    // Find a drug that's available and affordable
    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = getMaxBuyQuantity(state, drug);

    if (maxQty > 0) {
      const buyQty = Math.min(maxQty, 5);
      const newState = applyAction(state, { type: 'BUY', drug, quantity: buyQty });

      expect(newState.cash).toBe(state.cash - price * buyQty);
      expect(newState.inventory.find((s) => s.drug === drug)?.quantity).toBe(buyQty);
      expect(newState.actionLog.length).toBe(1);
    }
  });

  it('allows selling a held drug', () => {
    const state = createNewGame(TEST_SEED);

    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = getMaxBuyQuantity(state, drug);

    if (maxQty > 0) {
      const buyQty = Math.min(maxQty, 5);
      let newState = applyAction(state, { type: 'BUY', drug, quantity: buyQty });

      // Sell half
      const sellQty = Math.floor(buyQty / 2) || 1;
      newState = applyAction(newState, { type: 'SELL', drug, quantity: sellQty });

      expect(newState.inventory.find((s) => s.drug === drug)?.quantity).toBe(buyQty - sellQty);
    }
  });

  it('throws when buying more than cash allows', () => {
    const state = createNewGame(TEST_SEED);

    // Find the most expensive drug
    const entries = Object.entries(state.market) as [DrugName, number][];
    const [drug] = entries.sort(([, a], [, b]) => b - a)[0];

    expect(() =>
      applyAction(state, { type: 'BUY', drug, quantity: 99999 })
    ).toThrow();
  });

  it('throws when selling more than inventory', () => {
    const state = createNewGame(TEST_SEED);
    const drug = (Object.keys(state.market) as DrugName[])[0];

    expect(() =>
      applyAction(state, { type: 'SELL', drug, quantity: 1 })
    ).toThrow();
  });
});

describe('applyAction - TRAVEL', () => {
  it('advances the day and changes district', () => {
    const state = createNewGame(TEST_SEED);
    const newState = applyAction(state, { type: 'TRAVEL', destination: 'Manhattan' });

    expect(newState.currentDay).toBe(2);
    expect(newState.currentDistrict).toBe('Manhattan');
  });

  it('accrues loan shark interest on travel', () => {
    const state = createNewGame(TEST_SEED);
    const newState = applyAction(state, { type: 'TRAVEL', destination: 'Manhattan' });

    // Skip check if combat/event interrupts (debt may change before we see market phase)
    if (newState.phase === 'market') {
      // 10% interest on 5000 = 500, new debt = 5500
      expect(newState.debt).toBe(Math.floor(STARTING_DEBT * 1.1));
    }
  });

  it('throws when traveling to current district', () => {
    const state = createNewGame(TEST_SEED);

    expect(() =>
      applyAction(state, { type: 'TRAVEL', destination: 'Bronx' })
    ).toThrow();
  });

  it('ends game when max days reached', () => {
    let state = createNewGame(TEST_SEED);
    // Force day to near-end
    state = { ...state, currentDay: 30 };

    const newState = applyAction(state, { type: 'TRAVEL', destination: 'Manhattan' });
    expect(newState.phase).toBe('game_over');
    expect(newState.currentDay).toBe(31);
  });
});

describe('applyAction - BANK/DEBT', () => {
  it('deposits cash to bank', () => {
    const state = createNewGame(TEST_SEED);
    const newState = applyAction(state, { type: 'BANK_DEPOSIT', amount: 500 });

    expect(newState.cash).toBe(STARTING_CASH - 500);
    expect(newState.bank).toBe(500);
  });

  it('withdraws from bank', () => {
    let state = createNewGame(TEST_SEED);
    state = applyAction(state, { type: 'BANK_DEPOSIT', amount: 1000 });
    state = applyAction(state, { type: 'BANK_WITHDRAW', amount: 600 });

    expect(state.bank).toBe(400);
    expect(state.cash).toBe(STARTING_CASH - 1000 + 600);
  });

  it('pays debt', () => {
    const state = createNewGame(TEST_SEED);
    const newState = applyAction(state, { type: 'PAY_DEBT', amount: 1000 });

    expect(newState.cash).toBe(STARTING_CASH - 1000);
    expect(newState.debt).toBe(STARTING_DEBT - 1000);
  });
});

describe('applyAction - invalid actions', () => {
  it('throws for buy in combat phase', () => {
    let state = createNewGame(TEST_SEED);
    state = { ...state, phase: 'combat' };

    expect(() =>
      applyAction(state, { type: 'BUY', drug: 'Weed', quantity: 1 })
    ).toThrow('Invalid action');
  });

  it('throws for travel in event phase', () => {
    let state = createNewGame(TEST_SEED);
    state = { ...state, phase: 'event' };

    expect(() =>
      applyAction(state, { type: 'TRAVEL', destination: 'Brooklyn' })
    ).toThrow('Invalid action');
  });
});

describe('calculateNetWorth', () => {
  it('calculates correct starting net worth', () => {
    const state = createNewGame(TEST_SEED);
    const netWorth = calculateNetWorth(state);

    // Starting: $2000 cash + $0 bank - $5000 debt + $0 inventory = -$3000
    expect(netWorth).toBe(STARTING_CASH - STARTING_DEBT);
  });

  it('includes inventory value in net worth', () => {
    let state = createNewGame(TEST_SEED);

    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = getMaxBuyQuantity(state, drug);

    if (maxQty > 0) {
      const buyQty = Math.min(maxQty, 5);
      state = applyAction(state, { type: 'BUY', drug, quantity: buyQty });

      const netWorth = calculateNetWorth(state);
      const inventoryValue = price * buyQty;

      expect(netWorth).toBe(state.cash + state.bank - state.debt + inventoryValue);
    }
  });
});

describe('Replay engine', () => {
  it('replays a game and produces the same final state', () => {
    let state = createNewGame(TEST_SEED);

    // Play a few actions
    const actions: PlayerAction[] = [];

    // Buy something if possible
    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = getMaxBuyQuantity(state, drug);
    if (maxQty > 0) {
      const action: PlayerAction = { type: 'BUY', drug, quantity: Math.min(maxQty, 3) };
      actions.push(action);
      state = applyAction(state, action);
    }

    // Travel
    const travelAction: PlayerAction = { type: 'TRAVEL', destination: 'Manhattan' };
    actions.push(travelAction);
    state = applyAction(state, travelAction);

    // Replay with same seed and actions
    const result = replayGame(TEST_SEED, '30', actions);

    expect(result.valid).toBe(true);
    expect(result.finalDay).toBe(state.currentDay);
    expect(result.finalCash).toBe(state.cash);
    expect(result.finalDebt).toBe(state.debt);
  });

  it('detects invalid action sequences', () => {
    // Try to sell something we don't own
    const result = replayGame(TEST_SEED, '30', [
      { type: 'SELL', drug: 'Cocaine', quantity: 100 },
    ]);

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

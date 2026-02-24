import { describe, it, expect } from 'vitest';
import { createProGame, applyProAction, calculateProNetWorth, isProMode } from '../pro-game';
import { STARTING_CASH, STARTING_DEBT, STARTING_HEALTH, STARTING_TRENCHCOAT_SPACE, MAX_DAYS } from '../constants';
import type { ProPlayerAction, DrugName } from '../types';

const TEST_SEED = 'pro-game-test-seed';

describe('isProMode', () => {
  it('returns true for pro modes', () => {
    expect(isProMode('pro_30')).toBe(true);
    expect(isProMode('pro_45')).toBe(true);
    expect(isProMode('pro_60')).toBe(true);
  });

  it('returns false for classic modes', () => {
    expect(isProMode('30')).toBe(false);
  });
});

describe('createProGame', () => {
  it('creates a game with correct starting state', () => {
    const state = createProGame(TEST_SEED, 'pro_30');

    expect(state.seed).toBe(TEST_SEED);
    expect(state.gameMode).toBe('pro_30');
    expect(state.currentDay).toBe(1);
    expect(state.maxDays).toBe(MAX_DAYS['pro_30']);
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

    // Pro-specific fields
    expect(state.assets).toEqual([]);
    expect(state.armory).toEqual([]);
    expect(state.labState).toBeNull();
    expect(state.proCombat).toBeNull();
    expect(state.plantationBuffer).toEqual([]);
    expect(state.deaSurvived).toBe(0);
    expect(state.totalDrugsSold).toBe(0);
    expect(state.totalDrugsCut).toBe(0);
  });

  it('generates market prices on creation', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const availableDrugs = Object.keys(state.market);
    expect(availableDrugs.length).toBeGreaterThan(0);

    for (const price of Object.values(state.market)) {
      expect(price).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const state1 = createProGame(TEST_SEED, 'pro_30');
    const state2 = createProGame(TEST_SEED, 'pro_30');

    expect(state1.market).toEqual(state2.market);
    expect(state1.marketEvents).toEqual(state2.marketEvents);
  });

  it('supports all pro game modes', () => {
    expect(createProGame(TEST_SEED, 'pro_30').maxDays).toBe(31);
    expect(createProGame(TEST_SEED, 'pro_45').maxDays).toBe(46);
    expect(createProGame(TEST_SEED, 'pro_60').maxDays).toBe(61);
  });
});

describe('applyProAction - BUY/SELL', () => {
  it('buys an available drug', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = Math.min(Math.floor(state.cash / price), state.trenchcoatSpace);

    if (maxQty > 0) {
      const buyQty = Math.min(maxQty, 5);
      const result = applyProAction(state, { type: 'BUY', drug, quantity: buyQty });

      expect(result.cash).toBe(state.cash - price * buyQty);
      expect(result.inventory.find((s) => s.drug === drug)?.quantity).toBe(buyQty);
      expect(result.actionLog).toHaveLength(1);
    }
  });

  it('sells a held drug and tracks totalDrugsSold', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = Math.min(Math.floor(state.cash / price), state.trenchcoatSpace);

    if (maxQty > 0) {
      const buyQty = Math.min(maxQty, 5);
      let result = applyProAction(state, { type: 'BUY', drug, quantity: buyQty });

      const sellQty = Math.floor(buyQty / 2) || 1;
      result = applyProAction(result, { type: 'SELL', drug, quantity: sellQty });

      expect(result.totalDrugsSold).toBe(sellQty);
    }
  });
});

describe('applyProAction - TRAVEL', () => {
  it('advances day and changes location', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const result = applyProAction(state, { type: 'TRAVEL', destination: 'Manhattan' });

    expect(result.currentDay).toBe(2);
    expect(result.currentDistrict).toBe('Manhattan');
  });

  it('accrues interest on travel', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const result = applyProAction(state, { type: 'TRAVEL', destination: 'Manhattan' });

    // May be in combat/event, but if market phase, debt should have grown
    if (result.phase === 'market') {
      expect(result.debt).toBe(Math.floor(STARTING_DEBT * 1.1));
    }
  });

  it('throws when traveling to current location', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    expect(() =>
      applyProAction(state, { type: 'TRAVEL', destination: 'Bronx' })
    ).toThrow('Cannot travel to your current location');
  });

  it('ends game when max days reached', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = { ...state, currentDay: 30 };

    const result = applyProAction(state, { type: 'TRAVEL', destination: 'Manhattan' });
    expect(result.phase).toBe('game_over');
    expect(result.currentDay).toBe(31);
  });
});

describe('applyProAction - BANK/DEBT', () => {
  it('deposits cash to bank', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const result = applyProAction(state, { type: 'BANK_DEPOSIT', amount: 500 });

    expect(result.cash).toBe(STARTING_CASH - 500);
    expect(result.bank).toBe(500);
  });

  it('withdraws from bank', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = applyProAction(state, { type: 'BANK_DEPOSIT', amount: 1000 });
    state = applyProAction(state, { type: 'BANK_WITHDRAW', amount: 600 });

    expect(state.bank).toBe(400);
    expect(state.cash).toBe(STARTING_CASH - 1000 + 600);
  });

  it('pays debt', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const result = applyProAction(state, { type: 'PAY_DEBT', amount: 1000 });

    expect(result.cash).toBe(STARTING_CASH - 1000);
    expect(result.debt).toBe(STARTING_DEBT - 1000);
  });
});

describe('applyProAction - ASSETS', () => {
  it('buys asset via dispatch', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = { ...state, cash: 100_000 };

    const result = applyProAction(state, { type: 'BUY_ASSET', assetType: 'Van' });
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].type).toBe('Van');
  });
});

describe('applyProAction - invalid actions', () => {
  it('throws for buy in combat phase', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = { ...state, phase: 'combat' };

    expect(() =>
      applyProAction(state, { type: 'BUY', drug: 'Weed', quantity: 1 })
    ).toThrow('Invalid action');
  });

  it('throws for travel in event phase', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = { ...state, phase: 'event' };

    expect(() =>
      applyProAction(state, { type: 'TRAVEL', destination: 'Manhattan' })
    ).toThrow('Invalid action');
  });
});

describe('calculateProNetWorth', () => {
  it('calculates correct starting net worth', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const netWorth = calculateProNetWorth(state);

    expect(netWorth).toBe(STARTING_CASH - STARTING_DEBT);
  });

  it('includes inventory value', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    const [drug, price] = Object.entries(state.market)[0] as [DrugName, number];
    const maxQty = Math.min(Math.floor(state.cash / price), state.trenchcoatSpace);

    if (maxQty > 0) {
      const buyQty = Math.min(maxQty, 5);
      state = applyProAction(state, { type: 'BUY', drug, quantity: buyQty });

      const netWorth = calculateProNetWorth(state);
      const inventoryValue = price * buyQty;
      expect(netWorth).toBe(state.cash + state.bank - state.debt + inventoryValue);
    }
  });
});

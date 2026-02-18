import { describe, it, expect } from 'vitest';
import { buyAsset, hasAsset, processPlantation } from '../assets';
import { createProGame } from '../pro-game';
import type { ProGameState, AssetType } from '../types';
import { ASSET_MAP, PLANTATION_BUFFER_MAX } from '../pro-constants';
import { STARTING_TRENCHCOAT_SPACE } from '../constants';

const TEST_SEED = 'test-pro-seed-123';
const GAME_MODE = 'pro_30';

describe('buyAsset', () => {
  it('successfully buys an asset and deducts cash', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 300000 };

    const newState = buyAsset(richState, 'Lab');

    expect(newState.cash).toBe(richState.cash - ASSET_MAP['Lab'].cost);
    expect(newState.assets).toHaveLength(1);
    expect(newState.assets[0].type).toBe('Lab');
    expect(newState.assets[0].purchasedDay).toBe(state.currentDay);
  });

  it('adds stash bonus when buying an asset with stashBonus', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 300000 };
    const initialSpace = richState.trenchcoatSpace;

    const newState = buyAsset(richState, 'Van');

    expect(newState.trenchcoatSpace).toBe(initialSpace + ASSET_MAP['Van'].stashBonus);
    expect(newState.trenchcoatSpace).toBe(STARTING_TRENCHCOAT_SPACE + 75);
  });

  it('does not add stash bonus for assets without stashBonus', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 300000 };
    const initialSpace = richState.trenchcoatSpace;

    const newState = buyAsset(richState, 'Lab');

    expect(newState.trenchcoatSpace).toBe(initialSpace);
    expect(ASSET_MAP['Lab'].stashBonus).toBe(0);
  });

  it('throws when trying to buy an asset already owned', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 300000 };

    const stateWithAsset = buyAsset(richState, 'Van');

    expect(() => buyAsset(stateWithAsset, 'Van')).toThrow('Already own Van');
  });

  it('throws when not enough cash to buy asset', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const poorState = { ...state, cash: 1000 };

    expect(() => buyAsset(poorState, 'Lab')).toThrow('Not enough cash to buy Lab (need $50000)');
  });

  it('correctly handles buying multiple different assets', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 300000 };

    let newState = buyAsset(richState, 'Lab');
    newState = buyAsset(newState, 'Van');
    newState = buyAsset(newState, 'Stash House');

    expect(newState.assets).toHaveLength(3);
    expect(newState.assets.map(a => a.type)).toEqual(['Lab', 'Van', 'Stash House']);
    expect(newState.trenchcoatSpace).toBe(
      STARTING_TRENCHCOAT_SPACE +
      ASSET_MAP['Van'].stashBonus +
      ASSET_MAP['Stash House'].stashBonus
    );
  });

  it('buys expensive assets correctly', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 1_200_000 };

    const newState = buyAsset(richState, 'Submarine');

    expect(newState.cash).toBe(1_200_000 - 1_000_000);
    expect(newState.assets).toHaveLength(1);
    expect(newState.assets[0].type).toBe('Submarine');
    expect(newState.trenchcoatSpace).toBe(STARTING_TRENCHCOAT_SPACE + 75);
  });
});

describe('hasAsset', () => {
  it('returns true when player owns the asset', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 300000 };
    const stateWithAsset = buyAsset(richState, 'Lab');

    expect(hasAsset(stateWithAsset, 'Lab')).toBe(true);
  });

  it('returns false when player does not own the asset', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);

    expect(hasAsset(state, 'Lab')).toBe(false);
    expect(hasAsset(state, 'Van')).toBe(false);
    expect(hasAsset(state, 'Plantation')).toBe(false);
  });

  it('returns false for one asset when another is owned', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 300000 };
    const stateWithLab = buyAsset(richState, 'Lab');

    expect(hasAsset(stateWithLab, 'Lab')).toBe(true);
    expect(hasAsset(stateWithLab, 'Van')).toBe(false);
  });

  it('checks all asset types correctly', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    // Use 2_500_000 to afford all assets in sequence:
    // Lab $50k + Van $20k + Stash House $40k + Warehouse $150k + Plane $300k + Plantation $350k + Submarine $1M = $1.91M
    const richState = { ...state, cash: 2_500_000 };

    const assetTypes: AssetType[] = ['Lab', 'Van', 'Stash House', 'Warehouse', 'Plane', 'Plantation', 'Submarine'];

    let currentState = richState;
    for (const assetType of assetTypes) {
      expect(hasAsset(currentState, assetType)).toBe(false);
      currentState = buyAsset(currentState, assetType);
      expect(hasAsset(currentState, assetType)).toBe(true);
    }
  });
});

describe('processPlantation', () => {
  it('does nothing when Plantation asset is not owned', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };

    const newState = processPlantation(richState);

    expect(newState).toEqual(richState);
    expect(newState.inventory).toEqual([]);
    expect(newState.plantationBuffer).toEqual([]);
  });

  it('produces Weed and Shrooms with deterministic quantities', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    const newState = processPlantation(stateWithPlantation);

    // Should produce some Weed and Shrooms
    expect(newState.inventory.length).toBeGreaterThan(0);

    const weedSlot = newState.inventory.find(s => s.drug === 'Weed');
    const shroomsSlot = newState.inventory.find(s => s.drug === 'Shrooms');

    // Both should be produced
    expect(weedSlot).toBeDefined();
    expect(shroomsSlot).toBeDefined();

    // Weed: 2-5, Shrooms: 1-3
    if (weedSlot) {
      expect(weedSlot.quantity).toBeGreaterThanOrEqual(2);
      expect(weedSlot.quantity).toBeLessThanOrEqual(5);
    }
    if (shroomsSlot) {
      expect(shroomsSlot.quantity).toBeGreaterThanOrEqual(1);
      expect(shroomsSlot.quantity).toBeLessThanOrEqual(3);
    }
  });

  it('produces deterministic results with same seed and day', () => {
    const state1 = createProGame(TEST_SEED, GAME_MODE);
    const richState1 = { ...state1, cash: 500000 };
    const stateWithPlantation1 = buyAsset(richState1, 'Plantation');
    const result1 = processPlantation(stateWithPlantation1);

    const state2 = createProGame(TEST_SEED, GAME_MODE);
    const richState2 = { ...state2, cash: 500000 };
    const stateWithPlantation2 = buyAsset(richState2, 'Plantation');
    const result2 = processPlantation(stateWithPlantation2);

    expect(result1.inventory).toEqual(result2.inventory);
  });

  it('produces different results on different days', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    const day1Result = processPlantation(stateWithPlantation);

    const day2State = { ...stateWithPlantation, currentDay: 2, inventory: [] };
    const day2Result = processPlantation(day2State);

    // Results should differ due to different day seeds
    expect(day1Result.inventory).not.toEqual(day2Result.inventory);
  });

  it('flushes buffer to inventory when space is available', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    // Add items to buffer
    const stateWithBuffer: ProGameState = {
      ...stateWithPlantation,
      plantationBuffer: [
        { drug: 'Weed', quantity: 5, avgBuyPrice: 0 },
        { drug: 'Shrooms', quantity: 3, avgBuyPrice: 0 },
      ],
    };

    const newState = processPlantation(stateWithBuffer);

    // Buffer should be flushed to inventory (if space), then new production added
    const totalWeed = newState.inventory.find(s => s.drug === 'Weed')?.quantity ?? 0;
    const totalShrooms = newState.inventory.find(s => s.drug === 'Shrooms')?.quantity ?? 0;

    // Should have at least the buffered amounts plus new production
    expect(totalWeed).toBeGreaterThanOrEqual(5); // buffered 5 + new production (2-5)
    expect(totalShrooms).toBeGreaterThanOrEqual(3); // buffered 3 + new production (1-3)
  });

  it('keeps items in buffer when inventory is full', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    // Fill inventory completely
    const stateFullInventory: ProGameState = {
      ...stateWithPlantation,
      inventory: [
        { drug: 'Cocaine', quantity: STARTING_TRENCHCOAT_SPACE, avgBuyPrice: 20000 },
      ],
    };

    const newState = processPlantation(stateFullInventory);

    // All production should go to buffer
    expect(newState.plantationBuffer.length).toBeGreaterThan(0);

    const bufferTotal = newState.plantationBuffer.reduce((sum, s) => sum + s.quantity, 0);
    expect(bufferTotal).toBeGreaterThan(0);
    expect(bufferTotal).toBeLessThanOrEqual(PLANTATION_BUFFER_MAX);
  });

  it('respects buffer maximum capacity', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    // Fill inventory and buffer near max
    const stateFullInventory: ProGameState = {
      ...stateWithPlantation,
      inventory: [
        { drug: 'Cocaine', quantity: STARTING_TRENCHCOAT_SPACE, avgBuyPrice: 20000 },
      ],
      plantationBuffer: [
        { drug: 'Weed', quantity: 45, avgBuyPrice: 0 },
      ],
    };

    const newState = processPlantation(stateFullInventory);

    const bufferTotal = newState.plantationBuffer.reduce((sum, s) => sum + s.quantity, 0);
    expect(bufferTotal).toBeLessThanOrEqual(PLANTATION_BUFFER_MAX);
  });

  it('adds to existing inventory slots correctly', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    // Start with some Weed in inventory
    const stateWithWeed: ProGameState = {
      ...stateWithPlantation,
      inventory: [
        { drug: 'Weed', quantity: 10, avgBuyPrice: 500 },
      ],
    };

    const newState = processPlantation(stateWithWeed);

    // Should have one Weed slot with increased quantity
    const weedSlots = newState.inventory.filter(s => s.drug === 'Weed');
    expect(weedSlots).toHaveLength(1);
    expect(weedSlots[0].quantity).toBeGreaterThan(10);
  });

  it('handles partial buffer flush when space is limited', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    // Fill most of inventory, leaving small space
    const statePartialSpace: ProGameState = {
      ...stateWithPlantation,
      inventory: [
        { drug: 'Cocaine', quantity: STARTING_TRENCHCOAT_SPACE - 5, avgBuyPrice: 20000 },
      ],
      plantationBuffer: [
        { drug: 'Weed', quantity: 20, avgBuyPrice: 0 },
      ],
    };

    const newState = processPlantation(statePartialSpace);

    // Some buffer items should move to inventory, rest stay in buffer
    const inventorySpace = newState.inventory.reduce((sum, s) => sum + s.quantity, 0);
    expect(inventorySpace).toBeLessThanOrEqual(STARTING_TRENCHCOAT_SPACE);

    // Buffer should still have items
    expect(newState.plantationBuffer.length).toBeGreaterThan(0);
  });

  it('sets avgBuyPrice to 0 for plantation-produced drugs', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    const stateWithPlantation = buyAsset(richState, 'Plantation');

    const newState = processPlantation(stateWithPlantation);

    const weedSlot = newState.inventory.find(s => s.drug === 'Weed');
    const shroomsSlot = newState.inventory.find(s => s.drug === 'Shrooms');

    if (weedSlot) {
      expect(weedSlot.avgBuyPrice).toBe(0);
    }
    if (shroomsSlot) {
      expect(shroomsSlot.avgBuyPrice).toBe(0);
    }
  });

  it('processes multiple days of plantation production', () => {
    const state = createProGame(TEST_SEED, GAME_MODE);
    const richState = { ...state, cash: 500000 };
    let currentState = buyAsset(richState, 'Plantation');

    // Process 5 days
    for (let day = 1; day <= 5; day++) {
      currentState = { ...currentState, currentDay: day };
      currentState = processPlantation(currentState);
    }

    // Should have accumulated production
    const weedSlot = currentState.inventory.find(s => s.drug === 'Weed');
    const shroomsSlot = currentState.inventory.find(s => s.drug === 'Shrooms');

    expect(weedSlot).toBeDefined();
    expect(shroomsSlot).toBeDefined();

    // After 5 days, should have significant quantities (5 * 2-5 for Weed, 5 * 1-3 for Shrooms)
    if (weedSlot) {
      expect(weedSlot.quantity).toBeGreaterThanOrEqual(10); // 5 days * min 2
    }
    if (shroomsSlot) {
      expect(shroomsSlot.quantity).toBeGreaterThanOrEqual(5); // 5 days * min 1
    }
  });
});

import { describe, it, expect } from 'vitest';
import { buyAsset, hasAsset } from '../assets';
import { createProGame } from '../pro-game';
import type { AssetType } from '../types';
import { ASSET_MAP } from '../pro-constants';
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
    // Lab $50k + Van $20k + Stash House $40k + Warehouse $150k + Plane $300k + Plantation $150M + Submarine $1M = ~$151.56M
    const richState = { ...state, cash: 160_000_000 };

    const assetTypes: AssetType[] = ['Lab', 'Van', 'Stash House', 'Warehouse', 'Plane', 'Plantation', 'Submarine'];

    let currentState = richState;
    for (const assetType of assetTypes) {
      expect(hasAsset(currentState, assetType)).toBe(false);
      currentState = buyAsset(currentState, assetType);
      expect(hasAsset(currentState, assetType)).toBe(true);
    }
  });
});


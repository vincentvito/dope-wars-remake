import { describe, it, expect } from 'vitest';
import {
  getEncounterChance,
  determineEncounterType,
  initProCombat,
  resolveProFight,
  resolveProRun,
} from '../pro-combat';
import { createProGame } from '../pro-game';
import { buyAsset } from '../assets';
import { addWeapon } from '../armory';
import { SeededRNG } from '../rng';
import type { Weapon } from '../types';

const TEST_SEED = 'combat-test-seed';

const PISTOL: Weapon = { name: 'Pistol', tier: 'Pistol', foundDay: 1 };

function createCombatState(encounterType: 'police' | 'dea' | 'swat' = 'police') {
  let state = createProGame(TEST_SEED, 'pro_30');
  state = { ...state, cash: 50_000 };

  // Add inventory for confiscation tests
  state = {
    ...state,
    inventory: [
      { drug: 'Weed', quantity: 100, avgBuyPrice: 50 },
      { drug: 'Cocaine', quantity: 20, avgBuyPrice: 500 },
    ],
  };

  const rng = new SeededRNG(`${TEST_SEED}-init-combat`);
  const proCombat = initProCombat(state, encounterType, rng);

  return {
    ...state,
    proCombat,
    phase: 'combat' as const,
  };
}

describe('getEncounterChance', () => {
  it('returns a positive integer', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const chance = getEncounterChance(state, 'Manhattan');
    expect(chance).toBeGreaterThanOrEqual(4);
  });

  it('is higher (less likely) with Submarine', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = { ...state, cash: 1_500_000 };
    const baseChance = getEncounterChance(state, 'Manhattan');

    state = buyAsset(state, 'Submarine');
    const withSubmarine = getEncounterChance(state, 'Manhattan');

    expect(withSubmarine).toBeGreaterThan(baseChance);
  });
});

describe('determineEncounterType', () => {
  it('returns police by default', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const rng = new SeededRNG('encounter-type');
    const type = determineEncounterType(state, rng);
    expect(type).toBe('police');
  });

  it('can return swat when conditions met', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = { ...state, cash: 1_000_000 };

    // Meet SWAT conditions: 4+ assets AND 3+ DEA survived
    state = buyAsset(state, 'Lab');
    state = buyAsset(state, 'Van');
    state = buyAsset(state, 'Stash House');
    state = buyAsset(state, 'Warehouse');
    state = { ...state, deaSurvived: 4 };

    // Also need Plane for Medellin unlock (DEA check)
    state = buyAsset(state, 'Plane');

    // Try many seeds to find a SWAT encounter
    let foundSwat = false;
    for (let i = 0; i < 50; i++) {
      const rng = new SeededRNG(`swat-check-${i}`);
      const type = determineEncounterType(state, rng);
      if (type === 'swat') {
        foundSwat = true;
        break;
      }
    }
    expect(foundSwat).toBe(true);
  });
});

describe('initProCombat', () => {
  it('creates police combat state', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const rng = new SeededRNG('init-police');
    const combat = initProCombat(state, 'police', rng);

    expect(combat.encounterType).toBe('police');
    expect(combat.officerHealth).toBeGreaterThan(0);
    expect(combat.officerMaxHealth).toBe(combat.officerHealth);
    expect(combat.officerDamage).toBeGreaterThan(0);
    expect(combat.roundsElapsed).toBe(0);
    expect(combat.fineRate).toBe(0.20);
    expect(combat.confiscationRate).toBe(0.15);
    expect(combat.selectedLoadout).toEqual([]);
  });

  it('creates DEA combat with higher stats', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const rng = new SeededRNG('init-dea');
    const combat = initProCombat(state, 'dea', rng);

    expect(combat.encounterType).toBe('dea');
    expect(combat.fineRate).toBe(0.40);
    expect(combat.confiscationRate).toBe(0.35);
  });

  it('creates SWAT combat with highest stats', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const rng = new SeededRNG('init-swat');
    const combat = initProCombat(state, 'swat', rng);

    expect(combat.encounterType).toBe('swat');
    expect(combat.fineRate).toBe(0.50);
    expect(combat.confiscationRate).toBe(0.50);
  });
});

describe('resolveProFight', () => {
  it('deals damage to officer', () => {
    const state = createCombatState();
    const result = resolveProFight(state);

    if (result.proCombat) {
      expect(result.proCombat.officerHealth).toBeLessThan(state.proCombat!.officerHealth);
      expect(result.proCombat.roundsElapsed).toBe(1);
    }
  });

  it('ends combat when officer defeated', () => {
    let state = createCombatState();
    state = {
      ...state,
      proCombat: { ...state.proCombat!, officerHealth: 1 },
    };

    const result = resolveProFight(state);
    expect(result.proCombat).toBeNull();
    expect(result.phase).toBe('market');
  });

  it('game over when player dies', () => {
    let state = createCombatState();
    state = { ...state, health: 1 };
    state = {
      ...state,
      proCombat: { ...state.proCombat!, officerHealth: 100, officerDamage: 50 },
    };

    const result = resolveProFight(state);
    expect(result.phase).toBe('game_over');
    expect(result.health).toBe(0);
  });

  it('applies loadout damage bonus', () => {
    const base = createCombatState();
    let state = addWeapon(base, PISTOL);
    state = {
      ...state,
      proCombat: {
        ...base.proCombat,
        selectedLoadout: [PISTOL],
        officerHealth: 200,
        officerMaxHealth: 200,
      },
    };

    const result = resolveProFight(state);
    if (result.proCombat) {
      // Damage should be base (5-10) + Pistol bonus (5)
      const dealt = 200 - result.proCombat.officerHealth;
      expect(dealt).toBeGreaterThanOrEqual(10); // min 5 base + 5 pistol
    }
  });
});

describe('resolveProRun', () => {
  it('applies fines and confiscation on successful escape', () => {
    let state = createCombatState();
    state = {
      ...state,
      proCombat: { ...state.proCombat!, roundsElapsed: 10 },
    };

    let escaped = false;
    for (let i = 0; i < 30; i++) {
      const testState = { ...state, seed: `run-success-${i}` };
      const result = resolveProRun(testState);
      if (result.phase === 'market' && result.proCombat === null) {
        escaped = true;
        expect(result.cash).toBeLessThan(state.cash);
        break;
      }
    }
    expect(escaped).toBe(true);
  });

  it('officer hits back on failed escape', () => {
    const state = createCombatState();

    let failed = false;
    for (let i = 0; i < 30; i++) {
      const testState = { ...state, seed: `run-fail-${i}` };
      const result = resolveProRun(testState);
      if (result.proCombat !== null) {
        failed = true;
        expect(result.health).toBeLessThan(state.health);
        break;
      }
    }
    expect(failed).toBe(true);
  });

  it('preserves loadout weapons on successful escape', () => {
    let state = createCombatState();
    state = addWeapon(state, PISTOL);
    state = {
      ...state,
      proCombat: {
        ...state.proCombat!,
        selectedLoadout: [PISTOL],
        roundsElapsed: 10,
      },
    };

    let found = false;
    for (let i = 0; i < 30; i++) {
      const testState = { ...state, seed: `pro-run-preserve-${i}` };
      const result = resolveProRun(testState);
      if (result.phase === 'market') {
        expect(result.armory).toHaveLength(1); // Pistol preserved
        expect(result.armory[0].name).toBe('Pistol');
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

describe('resolveProFight — weapon consumption', () => {
  it('removes loadout weapons from armory when officer is defeated', () => {
    let state = createCombatState();
    const uzi: Weapon = { name: 'Uzi', tier: 'SMG', foundDay: 1 };
    state = addWeapon(state, PISTOL);
    state = addWeapon(state, uzi);

    state = {
      ...state,
      proCombat: {
        ...state.proCombat!,
        selectedLoadout: [PISTOL],
        officerHealth: 1,
      },
    };

    const result = resolveProFight(state);
    expect(result.phase).toBe('market');
    expect(result.proCombat).toBeNull();
    // Pistol consumed, Uzi remains
    expect(result.armory).toHaveLength(1);
    expect(result.armory[0].name).toBe('Uzi');
  });

  it('does not consume weapons during mid-combat rounds', () => {
    let state = createCombatState();
    state = addWeapon(state, PISTOL);
    state = {
      ...state,
      proCombat: {
        ...state.proCombat!,
        selectedLoadout: [PISTOL],
        officerHealth: 200,
        officerMaxHealth: 200,
      },
    };

    const result = resolveProFight(state);
    if (result.proCombat) {
      expect(result.armory).toHaveLength(1);
      expect(result.armory[0].name).toBe('Pistol');
    }
  });
});


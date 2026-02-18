import { describe, it, expect } from 'vitest';
import {
  addWeapon,
  discardWeapon,
  swapWeapon,
  autoReplaceWeakest,
  selectLoadout,
  getLoadoutDamageBonus,
  getLoadoutRunPenalty,
  generateWeaponFind,
  isArmoryFull,
  getWeaponDefinition,
  consumeLoadoutWeapons,
} from '../armory';
import { createProGame } from '../pro-game';
import { initProCombat } from '../pro-combat';
import { SeededRNG } from '../rng';
import { MAX_ARMORY_SIZE, MAX_LOADOUT_SIZE } from '../pro-constants';
import type { Weapon } from '../types';

const TEST_SEED = 'armory-test-seed';

const PISTOL: Weapon = { name: 'Pistol', tier: 'Pistol', foundDay: 1 };
const UZI: Weapon = { name: 'Uzi', tier: 'SMG', foundDay: 1 };
const AK47: Weapon = { name: 'AK-47', tier: 'Rifle', foundDay: 1 };
const RPG: Weapon = { name: 'RPG', tier: 'Heavy', foundDay: 1 };

describe('addWeapon', () => {
  it('adds a weapon to empty armory', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const result = addWeapon(state, PISTOL);

    expect(result.armory).toHaveLength(1);
    expect(result.armory[0]).toEqual(PISTOL);
  });

  it('throws when armory is full', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    for (let i = 0; i < MAX_ARMORY_SIZE; i++) {
      state = addWeapon(state, { ...PISTOL, foundDay: i });
    }

    expect(() => addWeapon(state, UZI)).toThrow('Armory is full');
  });
});

describe('discardWeapon', () => {
  it('removes weapon at index', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = addWeapon(state, PISTOL);
    state = addWeapon(state, UZI);

    const result = discardWeapon(state, 0);
    expect(result.armory).toHaveLength(1);
    expect(result.armory[0].name).toBe('Uzi');
  });

  it('throws for invalid index', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    expect(() => discardWeapon(state, 0)).toThrow('Invalid weapon index');
  });
});

describe('swapWeapon', () => {
  it('replaces weapon at index', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = addWeapon(state, PISTOL);

    const result = swapWeapon(state, 0, UZI);
    expect(result.armory).toHaveLength(1);
    expect(result.armory[0].name).toBe('Uzi');
  });
});

describe('autoReplaceWeakest', () => {
  it('adds weapon when armory has space', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = addWeapon(state, PISTOL);

    const result = autoReplaceWeakest(state, UZI);
    expect(result.armory).toHaveLength(2);
  });

  it('replaces weakest weapon when armory is full', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    // Fill with 9 Pistols + 1 Uzi
    for (let i = 0; i < 9; i++) {
      state = addWeapon(state, { ...PISTOL, foundDay: i });
    }
    state = addWeapon(state, UZI);

    const result = autoReplaceWeakest(state, AK47);
    expect(result.armory).toHaveLength(MAX_ARMORY_SIZE);
    // Should have replaced a Pistol (weakest) with AK-47
    expect(result.armory.some((w) => w.name === 'AK-47')).toBe(true);
  });
});

describe('selectLoadout', () => {
  it('sets selected weapons and transitions to combat', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = addWeapon(state, PISTOL);
    state = addWeapon(state, UZI);

    // Need active combat for loadout selection
    const rng = new SeededRNG('test-combat');
    const proCombat = initProCombat(state, 'police', rng);
    state = { ...state, proCombat, phase: 'loadout' };

    const result = selectLoadout(state, [0, 1]);
    expect(result.phase).toBe('combat');
    expect(result.proCombat?.selectedLoadout).toHaveLength(2);
    expect(result.proCombat?.selectedLoadout[0].name).toBe('Pistol');
    expect(result.proCombat?.selectedLoadout[1].name).toBe('Uzi');
  });

  it('throws when selecting more than max loadout', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    for (let i = 0; i < 4; i++) {
      state = addWeapon(state, { ...PISTOL, foundDay: i });
    }

    const rng = new SeededRNG('test-combat');
    const proCombat = initProCombat(state, 'police', rng);
    state = { ...state, proCombat, phase: 'loadout' };

    expect(() => selectLoadout(state, [0, 1, 2, 3])).toThrow(`Cannot select more than ${MAX_LOADOUT_SIZE}`);
  });

  it('throws without active combat', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    expect(() => selectLoadout(state, [0])).toThrow('No active combat');
  });
});

describe('getLoadoutDamageBonus / getLoadoutRunPenalty', () => {
  it('calculates correct totals', () => {
    const loadout = [PISTOL, UZI];

    const pistolDef = getWeaponDefinition('Pistol')!;
    const uziDef = getWeaponDefinition('Uzi')!;

    expect(getLoadoutDamageBonus(loadout)).toBe(pistolDef.damageBonus + uziDef.damageBonus);
    expect(getLoadoutRunPenalty(loadout)).toBe(pistolDef.runPenalty + uziDef.runPenalty);
  });

  it('returns 0 for empty loadout', () => {
    expect(getLoadoutDamageBonus([])).toBe(0);
    expect(getLoadoutRunPenalty([])).toBe(0);
  });
});

describe('generateWeaponFind', () => {
  it('is deterministic with same seed', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    const rng1 = new SeededRNG('weapon-find-1');
    const rng2 = new SeededRNG('weapon-find-1');

    const weapon1 = generateWeaponFind(state, rng1);
    const weapon2 = generateWeaponFind(state, rng2);

    expect(weapon1).toEqual(weapon2);
  });

  it('can find Rifle and Heavy tier weapons', () => {
    const state = createProGame(TEST_SEED, 'pro_30');

    let foundHighTier = false;
    for (let i = 0; i < 200; i++) {
      const rng = new SeededRNG(`high-tier-weapon-${i}`);
      const weapon = generateWeaponFind(state, rng);
      if (weapon && (weapon.tier === 'Rifle' || weapon.tier === 'Heavy')) {
        foundHighTier = true;
        break;
      }
    }
    expect(foundHighTier).toBe(true);
  });
});

describe('isArmoryFull', () => {
  it('returns false when not full', () => {
    const state = createProGame(TEST_SEED, 'pro_30');
    expect(isArmoryFull(state)).toBe(false);
  });

  it('returns true when full', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    for (let i = 0; i < MAX_ARMORY_SIZE; i++) {
      state = addWeapon(state, { ...PISTOL, foundDay: i });
    }
    expect(isArmoryFull(state)).toBe(true);
  });
});

describe('consumeLoadoutWeapons', () => {
  it('removes loadout weapons from armory', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = addWeapon(state, PISTOL);
    state = addWeapon(state, UZI);
    state = addWeapon(state, AK47);

    const rng = new SeededRNG('consume-test');
    const proCombat = initProCombat(state, 'police', rng);
    state = {
      ...state,
      proCombat: { ...proCombat, selectedLoadout: [PISTOL, UZI] },
    };

    const result = consumeLoadoutWeapons(state);
    expect(result.armory).toHaveLength(1);
    expect(result.armory[0].name).toBe('AK-47');
  });

  it('returns state unchanged when no loadout', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = addWeapon(state, PISTOL);

    const result = consumeLoadoutWeapons(state);
    expect(result.armory).toHaveLength(1);
  });

  it('returns state unchanged when loadout is empty', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    state = addWeapon(state, PISTOL);

    const rng = new SeededRNG('empty-loadout');
    const proCombat = initProCombat(state, 'police', rng);
    state = { ...state, proCombat: { ...proCombat, selectedLoadout: [] } };

    const result = consumeLoadoutWeapons(state);
    expect(result.armory).toHaveLength(1);
  });

  it('handles duplicate weapons correctly', () => {
    let state = createProGame(TEST_SEED, 'pro_30');
    const pistol1: Weapon = { name: 'Pistol', tier: 'Pistol', foundDay: 1 };
    const pistol2: Weapon = { name: 'Pistol', tier: 'Pistol', foundDay: 5 };
    state = addWeapon(state, pistol1);
    state = addWeapon(state, pistol2);

    const rng = new SeededRNG('dup-test');
    const proCombat = initProCombat(state, 'police', rng);
    state = {
      ...state,
      proCombat: { ...proCombat, selectedLoadout: [pistol1] },
    };

    const result = consumeLoadoutWeapons(state);
    expect(result.armory).toHaveLength(1);
    expect(result.armory[0].foundDay).toBe(5); // pistol2 remains
  });
});

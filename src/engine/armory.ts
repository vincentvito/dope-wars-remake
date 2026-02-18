import type { ProGameState, Weapon, WeaponTier } from './types';
import {
  WEAPON_DEFINITIONS,
  MAX_ARMORY_SIZE,
  MAX_LOADOUT_SIZE,
  WEAPON_FIND_BASE_CHANCE,
  WEAPON_TIER_WEIGHTS,
} from './pro-constants';
import { SeededRNG } from './rng';

/**
 * Add a weapon to the armory.
 */
export function addWeapon(state: ProGameState, weapon: Weapon): ProGameState {
  if (state.armory.length >= MAX_ARMORY_SIZE) {
    throw new Error(`Armory is full (${MAX_ARMORY_SIZE}/${MAX_ARMORY_SIZE})`);
  }

  return {
    ...state,
    armory: [...state.armory, weapon],
  };
}

/**
 * Discard a weapon from the armory by index.
 */
export function discardWeapon(state: ProGameState, weaponIndex: number): ProGameState {
  if (weaponIndex < 0 || weaponIndex >= state.armory.length) {
    throw new Error(`Invalid weapon index: ${weaponIndex}`);
  }

  return {
    ...state,
    armory: state.armory.filter((_, i) => i !== weaponIndex),
  };
}

/**
 * Swap a weapon: discard one at index, add a new one.
 */
export function swapWeapon(
  state: ProGameState,
  discardIndex: number,
  newWeapon: Weapon
): ProGameState {
  if (discardIndex < 0 || discardIndex >= state.armory.length) {
    throw new Error(`Invalid weapon index: ${discardIndex}`);
  }

  const newArmory = [...state.armory];
  newArmory[discardIndex] = newWeapon;

  return {
    ...state,
    armory: newArmory,
  };
}

/**
 * Auto-replace the weakest weapon in armory (for SWAT drops).
 * Weakest = lowest damageBonus.
 */
export function autoReplaceWeakest(state: ProGameState, newWeapon: Weapon): ProGameState {
  if (state.armory.length < MAX_ARMORY_SIZE) {
    return addWeapon(state, newWeapon);
  }

  // Find weakest weapon
  let weakestIndex = 0;
  let lowestDamage = Infinity;
  for (let i = 0; i < state.armory.length; i++) {
    const def = getWeaponDefinition(state.armory[i].name);
    if (def && def.damageBonus < lowestDamage) {
      lowestDamage = def.damageBonus;
      weakestIndex = i;
    }
  }

  return swapWeapon(state, weakestIndex, newWeapon);
}

/**
 * Select weapons for combat loadout (max 3).
 * Sets proCombat.selectedLoadout.
 */
export function selectLoadout(state: ProGameState, weaponIndices: number[]): ProGameState {
  if (!state.proCombat) {
    throw new Error('No active combat to select loadout for');
  }

  if (weaponIndices.length > MAX_LOADOUT_SIZE) {
    throw new Error(`Cannot select more than ${MAX_LOADOUT_SIZE} weapons`);
  }

  // Validate indices
  for (const idx of weaponIndices) {
    if (idx < 0 || idx >= state.armory.length) {
      throw new Error(`Invalid weapon index: ${idx}`);
    }
  }

  const selectedWeapons = weaponIndices.map((i) => state.armory[i]);

  return {
    ...state,
    phase: 'combat',
    proCombat: {
      ...state.proCombat,
      selectedLoadout: selectedWeapons,
    },
  };
}

/**
 * Get total damage bonus from a loadout.
 */
export function getLoadoutDamageBonus(loadout: Weapon[]): number {
  return loadout.reduce((sum, w) => {
    const def = getWeaponDefinition(w.name);
    return sum + (def?.damageBonus ?? 0);
  }, 0);
}

/**
 * Get total run penalty from a loadout.
 */
export function getLoadoutRunPenalty(loadout: Weapon[]): number {
  return loadout.reduce((sum, w) => {
    const def = getWeaponDefinition(w.name);
    return sum + (def?.runPenalty ?? 0);
  }, 0);
}

/**
 * Single-roll weapon find system.
 * 1/10 base chance per travel.
 * If hit, weighted tier selection determines which weapon.
 */
export function generateWeaponFind(state: ProGameState, rng: SeededRNG): Weapon | null {
  // Roll 1: do we find a weapon?
  if (!rng.chance(WEAPON_FIND_BASE_CHANCE)) {
    return null;
  }

  // Roll 2: which tier?
  const tier = rollWeightedTier(rng, WEAPON_TIER_WEIGHTS);

  // Pick a random weapon from that tier
  const tierWeapons = WEAPON_DEFINITIONS.filter((w) => w.tier === tier);
  if (tierWeapons.length === 0) return null;

  const weaponDef = rng.pick(tierWeapons);

  return {
    name: weaponDef.name,
    tier: weaponDef.tier,
    foundDay: state.currentDay,
  };
}

/**
 * Remove loadout weapons from the armory after combat.
 * Weapons are single-use: once used to defeat an officer, they are consumed.
 * Matches by name + tier + foundDay to handle duplicates correctly.
 */
export function consumeLoadoutWeapons(state: ProGameState): ProGameState {
  if (!state.proCombat || state.proCombat.selectedLoadout.length === 0) {
    return state;
  }

  const toRemove = [...state.proCombat.selectedLoadout];
  const newArmory = [...state.armory];

  for (const weapon of toRemove) {
    const idx = newArmory.findIndex(
      (w) => w.name === weapon.name && w.tier === weapon.tier && w.foundDay === weapon.foundDay
    );
    if (idx !== -1) {
      newArmory.splice(idx, 1);
    }
  }

  return { ...state, armory: newArmory };
}

/**
 * Check if armory is full.
 */
export function isArmoryFull(state: ProGameState): boolean {
  return state.armory.length >= MAX_ARMORY_SIZE;
}

/**
 * Get weapon definition by name.
 */
export function getWeaponDefinition(name: string) {
  return WEAPON_DEFINITIONS.find((w) => w.name === name) ?? null;
}

/**
 * Roll a weighted tier from tier weights.
 */
function rollWeightedTier(rng: SeededRNG, weights: Record<string, number>): WeaponTier {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng.next() * totalWeight;

  for (const [tier, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return tier as WeaponTier;
    }
  }

  // Fallback (shouldn't happen)
  return entries[0][0] as WeaponTier;
}

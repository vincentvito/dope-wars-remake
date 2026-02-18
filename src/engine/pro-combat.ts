import type { ProGameState, ProCombatState, EncounterType, Weapon } from './types';
import { SeededRNG } from './rng';
import {
  ENCOUNTER_STATS,
  SWAT_CHANCE,
  SWAT_MIN_ASSETS,
  SWAT_MIN_DEA_SURVIVED,
  SUBMARINE_ENCOUNTER_REDUCTION,
  STASH_HOUSE_CONFISCATION_REDUCTION,
  BONUS_REDUCTION_CAP,
  WEAPON_DEFINITIONS,
  MAX_ARMORY_SIZE,
} from './pro-constants';
import { hasAsset } from './assets';
import { getLoadoutDamageBonus, getLoadoutRunPenalty, consumeLoadoutWeapons, addWeapon, autoReplaceWeakest } from './armory';
import { getLocationDangerLevel, isCity } from './cities';
import { meetsUnlockRequirements } from './cities';

/**
 * Get encounter chance for a destination. Returns 1-in-N.
 * Factors: destination danger level, Submarine (-20%).
 */
export function getEncounterChance(state: ProGameState, destination: string): number {
  const dangerLevel = getLocationDangerLevel(destination as any);

  // Base chance: 1 in (10 - dangerLevel), capped at min 4
  let baseChance = Math.max(4, 10 - dangerLevel);

  // Apply asset reductions (these increase the denominator)
  let reductionFactor = 0;
  if (hasAsset(state, 'Submarine')) {
    reductionFactor += SUBMARINE_ENCOUNTER_REDUCTION;
  }

  // Cap reduction at 80%
  reductionFactor = Math.min(reductionFactor, BONUS_REDUCTION_CAP);

  // Increase denominator to reduce chance (higher denominator = less likely)
  if (reductionFactor > 0) {
    baseChance = Math.round(baseChance / (1 - reductionFactor));
  }

  return baseChance;
}

/**
 * Determine encounter type based on game state.
 * Check order: SWAT first, then DEA, then Police.
 */
export function determineEncounterType(state: ProGameState, rng: SeededRNG): EncounterType {
  // SWAT: requires 4+ assets AND 3+ DEA survived
  if (
    state.assets.length >= SWAT_MIN_ASSETS &&
    state.deaSurvived >= SWAT_MIN_DEA_SURVIVED &&
    rng.chance(SWAT_CHANCE)
  ) {
    return 'swat';
  }

  // DEA: triggers after Medellin is unlocked (Plane)
  if (meetsUnlockRequirements(state, 'Medellin')) {
    // DEA chance scales with day progression
    const deaChance = Math.max(4, 12 - Math.floor(state.currentDay / 10));
    if (rng.chance(deaChance)) {
      return 'dea';
    }
  }

  return 'police';
}

/**
 * Initialize pro combat encounter.
 * Stats scale with dayFactor (same as classic).
 */
export function initProCombat(state: ProGameState, encounterType: EncounterType, rng: SeededRNG): ProCombatState {
  const stats = ENCOUNTER_STATS[encounterType];
  const dayFactor = 1 + (state.currentDay / state.maxDays) * 0.5;

  const baseHealth = rng.nextInt(stats.minHP, stats.maxHP);
  const baseDamage = rng.nextInt(stats.minDmg, stats.maxDmg);

  const encounterNames: Record<EncounterType, string> = {
    police: 'Officer Hardass',
    dea: 'DEA Agent',
    swat: 'SWAT Team',
  };

  return {
    officerHealth: Math.floor(baseHealth * dayFactor),
    officerMaxHealth: Math.floor(baseHealth * dayFactor),
    officerDamage: Math.floor(baseDamage * dayFactor),
    roundsElapsed: 0,
    lastMessage: `${encounterNames[encounterType]} is on your tail!`,
    encounterType,
    fineRate: stats.fineRate,
    confiscationRate: stats.confiscationRate,
    selectedLoadout: [],
  };
}

/**
 * Resolve a pro combat fight round.
 * Damage = base 5-10 + loadout damage bonus.
 */
export function resolveProFight(state: ProGameState): ProGameState {
  if (!state.proCombat) throw new Error('No active pro combat');

  const rng = new SeededRNG(
    `${state.seed}-procombat-day${state.currentDay}-round${state.proCombat.roundsElapsed}`
  );

  const combat = { ...state.proCombat };
  combat.roundsElapsed++;

  // Player damage: base 5-10 + loadout weapons
  let playerDamage = rng.nextInt(5, 10);
  playerDamage += getLoadoutDamageBonus(combat.selectedLoadout);

  // Apply damage to officer
  combat.officerHealth = Math.max(0, combat.officerHealth - playerDamage);

  // Check if officer is defeated
  if (combat.officerHealth <= 0) {
    // Consume loadout weapons (single-use) before nulling proCombat
    const consumed = consumeLoadoutWeapons(state);
    let newState: ProGameState = {
      ...consumed,
      proCombat: null,
      combat: null,
      activeEvent: null,
      phase: 'market',
    };

    // Track DEA survived
    if (combat.encounterType === 'dea') {
      newState = { ...newState, deaSurvived: newState.deaSurvived + 1 };
    }

    // SWAT defeat: guaranteed Rifle or Heavy weapon drop
    if (combat.encounterType === 'swat') {
      newState = { ...newState, deaSurvived: newState.deaSurvived + 1 };

      const swatDropWeapons = WEAPON_DEFINITIONS.filter(
        (w) => w.tier === 'Rifle' || w.tier === 'Heavy'
      );
      const dropDef = rng.pick(swatDropWeapons);
      const droppedWeapon: Weapon = {
        name: dropDef.name,
        tier: dropDef.tier,
        foundDay: newState.currentDay,
      };

      if (newState.armory.length < MAX_ARMORY_SIZE) {
        newState = addWeapon(newState, droppedWeapon);
      } else {
        newState = autoReplaceWeakest(newState, droppedWeapon);
      }
    }

    return newState;
  }

  // Officer attacks back
  const officerDamage = Math.max(1, combat.officerDamage + rng.nextInt(-2, 2));
  const newHealth = Math.max(0, state.health - officerDamage);

  combat.lastMessage = `You dealt ${playerDamage} damage. ${getEncounterName(combat.encounterType)} hit you for ${officerDamage}!`;

  if (newHealth <= 0) {
    return {
      ...state,
      health: 0,
      proCombat: null,
      combat: null,
      activeEvent: null,
      phase: 'game_over',
    };
  }

  return {
    ...state,
    health: newHealth,
    proCombat: combat,
  };
}

/**
 * Resolve a pro combat run attempt.
 * Escape chance: min(90, 40 + rounds*10 - loadoutRunPenalty)
 * On success: fines + confiscation applied.
 * On failure: officer free hit, combat continues.
 */
export function resolveProRun(state: ProGameState): ProGameState {
  if (!state.proCombat) throw new Error('No active pro combat');

  const rng = new SeededRNG(
    `${state.seed}-procombat-day${state.currentDay}-run${state.proCombat.roundsElapsed}`
  );

  const combat = { ...state.proCombat };
  combat.roundsElapsed++;

  // Calculate escape chance
  let escapeChance = 40 + (combat.roundsElapsed * 10);
  escapeChance -= getLoadoutRunPenalty(combat.selectedLoadout);
  escapeChance = Math.min(90, Math.max(5, escapeChance));

  const roll = rng.nextInt(1, 100);

  if (roll <= escapeChance) {
    // Successful escape — apply fines and confiscation
    let newState = applyPenalties(state, combat);

    // Track DEA survived
    if (combat.encounterType === 'dea' || combat.encounterType === 'swat') {
      newState = { ...newState, deaSurvived: newState.deaSurvived + 1 };
    }

    return {
      ...newState,
      proCombat: null,
      combat: null,
      activeEvent: null,
      phase: 'market',
    };
  }

  // Failed escape — officer free hit
  const officerDamage = Math.max(1, combat.officerDamage + rng.nextInt(-1, 3));
  const newHealth = Math.max(0, state.health - officerDamage);

  combat.lastMessage = `You couldn't escape! ${getEncounterName(combat.encounterType)} hit you for ${officerDamage} damage.`;

  if (newHealth <= 0) {
    return {
      ...state,
      health: 0,
      proCombat: null,
      combat: null,
      activeEvent: null,
      phase: 'game_over',
    };
  }

  return {
    ...state,
    health: newHealth,
    proCombat: combat,
  };
}

/**
 * Apply fines (% of cash) and confiscation (% of inventory drugs).
 * Reductions from Stash House — additive with 80% cap.
 */
function applyPenalties(state: ProGameState, combat: ProCombatState): ProGameState {
  // Calculate confiscation reduction
  let confiscationReduction = 0;
  if (hasAsset(state, 'Stash House')) confiscationReduction += STASH_HOUSE_CONFISCATION_REDUCTION;
  confiscationReduction = Math.min(confiscationReduction, BONUS_REDUCTION_CAP);

  // Apply fine to cash (no reductions)
  const fineAmount = Math.floor(state.cash * combat.fineRate);

  // Apply confiscation to inventory
  const effectiveConfiscationRate = combat.confiscationRate * (1 - confiscationReduction);
  const newInventory = state.inventory
    .map((slot) => ({
      ...slot,
      quantity: slot.quantity - Math.floor(slot.quantity * effectiveConfiscationRate),
    }))
    .filter((s) => s.quantity > 0);

  return {
    ...state,
    cash: state.cash - fineAmount,
    inventory: newInventory,
  };
}

/**
 * Get display name for encounter type.
 */
function getEncounterName(type: EncounterType): string {
  const names: Record<EncounterType, string> = {
    police: 'Officer Hardass',
    dea: 'DEA Agent',
    swat: 'SWAT Team',
  };
  return names[type];
}

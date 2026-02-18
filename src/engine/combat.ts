import { SeededRNG } from './rng';
import { GUN_DAMAGE_BONUS } from './constants';
import type { GameState, CombatState } from './types';

/**
 * Initialize a combat encounter. Officer stats scale with game progress.
 */
export function initCombat(state: GameState): CombatState {
  const rng = new SeededRNG(`${state.seed}-combat-day${state.currentDay}`);

  // Officers get tougher as the game progresses
  const dayFactor = 1 + (state.currentDay / state.maxDays) * 0.5;
  const baseHealth = rng.nextInt(20, 40);
  const baseDamage = rng.nextInt(3, 8);

  return {
    officerHealth: Math.floor(baseHealth * dayFactor),
    officerMaxHealth: Math.floor(baseHealth * dayFactor),
    officerDamage: Math.floor(baseDamage * dayFactor),
    roundsElapsed: 0,
    lastMessage: 'Officer Hardass is on your tail!',
  };
}

/**
 * Resolve a combat round when the player chooses to fight.
 * Returns updated game state with combat results.
 */
export function resolveFight(state: GameState): GameState {
  if (!state.combat) throw new Error('No active combat');

  const rng = new SeededRNG(
    `${state.seed}-combat-day${state.currentDay}-round${state.combat.roundsElapsed}`
  );

  const combat = { ...state.combat };
  combat.roundsElapsed++;

  // Player damage: base 5-10, plus gun bonus
  const playerBaseDamage = rng.nextInt(5, 10);
  const playerDamage = playerBaseDamage + (state.guns * GUN_DAMAGE_BONUS);

  // Apply player damage to officer
  combat.officerHealth = Math.max(0, combat.officerHealth - playerDamage);

  // Check if officer is defeated
  if (combat.officerHealth <= 0) {
    combat.lastMessage = `You defeated the officer! You dealt ${playerDamage} damage.`;
    return {
      ...state,
      guns: 0, // Weapons are single-use: consumed after winning a fight
      combat: null,
      activeEvent: null,
      phase: 'market',
    };
  }

  // Officer attacks back
  const officerDamage = Math.max(1, combat.officerDamage + rng.nextInt(-2, 2));
  const newHealth = Math.max(0, state.health - officerDamage);

  combat.lastMessage = `You dealt ${playerDamage} damage. Officer hit you for ${officerDamage}!`;

  // Check if player died
  if (newHealth <= 0) {
    return {
      ...state,
      health: 0,
      combat: null,
      activeEvent: null,
      phase: 'game_over',
    };
  }

  return {
    ...state,
    health: newHealth,
    combat,
  };
}

/**
 * Resolve a combat round when the player chooses to run.
 * Success chance improves with fewer guns (less conspicuous) and more rounds elapsed.
 */
export function resolveRun(state: GameState): GameState {
  if (!state.combat) throw new Error('No active combat');

  const rng = new SeededRNG(
    `${state.seed}-combat-day${state.currentDay}-run${state.combat.roundsElapsed}`
  );

  const combat = { ...state.combat };
  combat.roundsElapsed++;

  // Base escape chance: 40%, +10% per round elapsed, -5% per gun (heavier = slower)
  const escapeChance = Math.min(
    90,
    Math.max(5, 40 + (combat.roundsElapsed * 10) - (state.guns * 5))
  );

  const roll = rng.nextInt(1, 100);

  if (roll <= escapeChance) {
    // Successful escape — but may lose some drugs
    let newState = { ...state };

    // 30% chance to drop some inventory while running
    if (rng.chance(3) && newState.inventory.length > 0) {
      const slotIndex = rng.nextInt(0, newState.inventory.length - 1);
      const slot = newState.inventory[slotIndex];
      const dropAmount = rng.nextInt(1, Math.ceil(slot.quantity / 2));

      newState.inventory = newState.inventory
        .map((s, i) =>
          i === slotIndex
            ? { ...s, quantity: s.quantity - dropAmount }
            : s
        )
        .filter((s) => s.quantity > 0);

      combat.lastMessage = `You escaped! But you dropped ${dropAmount} ${slot.drug} while running.`;
    } else {
      combat.lastMessage = 'You escaped successfully!';
    }

    return {
      ...newState,
      combat: null,
      activeEvent: null,
      phase: 'market',
    };
  }

  // Failed to escape — officer gets a free hit
  const officerDamage = Math.max(1, combat.officerDamage + rng.nextInt(-1, 3));
  const newHealth = Math.max(0, state.health - officerDamage);

  combat.lastMessage = `You couldn't escape! Officer hit you for ${officerDamage} damage.`;

  if (newHealth <= 0) {
    return {
      ...state,
      health: 0,
      combat: null,
      activeEvent: null,
      phase: 'game_over',
    };
  }

  return {
    ...state,
    health: newHealth,
    combat,
  };
}

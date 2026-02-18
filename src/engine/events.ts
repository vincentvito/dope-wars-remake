import { createTravelRNG } from './rng';
import { DRUGS, DISTRICT_MAP, MAX_GUNS, GUN_PRICE, COAT_UPGRADE_SPACE } from './constants';
import type { GameEvent, GameState, DrugName } from './types';

/**
 * Generate a single travel event when moving between districts.
 * Returns at most one event — first check that fires wins.
 * Deterministic: same seed + day + route always produces the same event.
 */
export function generateTravelEvents(
  state: GameState,
  destination: string
): GameEvent[] {
  const rng = createTravelRNG(
    state.seed,
    state.currentDay + 1,
    state.currentDistrict,
    destination
  );

  const district = DISTRICT_MAP[destination as keyof typeof DISTRICT_MAP];
  const dangerLevel = district?.dangerLevel ?? 2;

  // Police encounter chance: higher in more dangerous districts
  // Base chance: 1 in (10 - dangerLevel), so dangerLevel 4 = 1 in 6
  const policeChance = Math.max(4, 10 - dangerLevel);
  if (rng.chance(policeChance)) {
    return [{
      type: 'police_encounter',
      message: 'Officer Hardass is chasing you!',
    }];
  }

  // Mugging chance: 1 in 15
  if (rng.chance(15)) {
    const lossAmount = Math.min(
      state.cash,
      rng.nextInt(100, Math.max(200, Math.floor(state.cash * 0.2)))
    );
    if (lossAmount > 0) {
      return [{
        type: 'mugging',
        message: `A mugger stole $${lossAmount.toLocaleString()} from you!`,
        cashChange: -lossAmount,
      }];
    }
  }

  // Find drugs on the ground: 1 in 12
  if (rng.chance(12)) {
    const cheapDrugs: DrugName[] = ['Weed', 'Shrooms', 'Peyote', 'Speed', 'Ecstasy'];
    const drug = rng.pick(cheapDrugs);
    const quantity = rng.nextInt(2, 8);
    const usedSpace = state.inventory.reduce((sum, s) => sum + s.quantity, 0);
    const availableSpace = state.trenchcoatSpace - usedSpace;
    const actualQty = Math.min(quantity, availableSpace);

    if (actualQty <= 0) {
      return [{
        type: 'find_drugs',
        message: `You found ${quantity} units of ${drug}, but your inventory is full!`,
        drug,
        quantity: 0,
      }];
    }
    if (actualQty < quantity) {
      return [{
        type: 'find_drugs',
        message: `You found ${quantity} units of ${drug}, but only picked up ${actualQty} (not enough space)!`,
        drug,
        quantity: actualQty,
      }];
    }
    return [{
      type: 'find_drugs',
      message: `You found ${quantity} units of ${drug} on the ground!`,
      drug,
      quantity,
    }];
  }

  // Find a gun: 1 in 20 (only if we can carry more)
  if (state.guns < MAX_GUNS && rng.chance(20)) {
    return [{
      type: 'find_gun',
      message: 'You found a gun on the street!',
      gunsChange: 1,
    }];
  }

  // Find a larger trenchcoat: 1 in 25 (once per game)
  if (!state.stashFound && rng.chance(25)) {
    return [{
      type: 'find_coat',
      message: `You found a bigger trenchcoat! (+${COAT_UPGRADE_SPACE} space)`,
      spaceChange: COAT_UPGRADE_SPACE,
    }];
  }

  // Loan shark goons: if debt > 10000 and 1 in 8
  if (state.debt > 10000 && rng.chance(8)) {
    const damage = rng.nextInt(5, 15);
    return [{
      type: 'loan_shark_goons',
      message: `The loan shark's goons beat you up for not paying! (-${damage} health)`,
      healthChange: -damage,
    }];
  }

  return [];
}

/**
 * Apply a non-combat event's effects to the game state.
 * Returns the updated state.
 */
export function applyEventEffects(state: GameState, event: GameEvent): GameState {
  let newState = { ...state };

  if (event.cashChange) {
    newState.cash = Math.max(0, newState.cash + event.cashChange);
  }

  if (event.healthChange) {
    newState.health = Math.max(0, Math.min(100, newState.health + event.healthChange));
  }

  if (event.spaceChange) {
    newState.trenchcoatSpace = newState.trenchcoatSpace + event.spaceChange;
    if (event.type === 'find_coat') {
      newState.stashFound = true;
    }
  }

  if (event.gunsChange) {
    newState.guns = Math.min(MAX_GUNS, newState.guns + event.gunsChange);
  }

  // Finding drugs: add to inventory if there's space
  if (event.type === 'find_drugs' && event.drug && event.quantity) {
    const usedSpace = newState.inventory.reduce((sum, s) => sum + s.quantity, 0);
    const availableSpace = newState.trenchcoatSpace - usedSpace;
    const quantityToAdd = Math.min(event.quantity, availableSpace);

    if (quantityToAdd > 0) {
      const existing = newState.inventory.find((s) => s.drug === event.drug);
      if (existing) {
        newState.inventory = newState.inventory.map((s) =>
          s.drug === event.drug
            ? { ...s, quantity: s.quantity + quantityToAdd }
            : s
        );
      } else {
        newState.inventory = [
          ...newState.inventory,
          { drug: event.drug, quantity: quantityToAdd, avgBuyPrice: newState.market[event.drug] ?? 0 },
        ];
      }
    }
  }

  // Check for death
  if (newState.health <= 0) {
    newState.phase = 'game_over';
  }

  return newState;
}

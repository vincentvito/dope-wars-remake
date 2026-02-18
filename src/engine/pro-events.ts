import { createTravelRNG } from './rng';
import { DRUGS } from './constants';
import {
  STASH_FIND_CHANCE,
  STASH_FIND_TIERS,
  PRO_EVENT_THRESHOLDS,
  CELEBRITY_BUYER_PRICE_MULTIPLIER,
} from './pro-constants';
import type { ProGameState, GameEvent, DrugName, LocationName } from './types';
import { getEncounterChance, determineEncounterType } from './pro-combat';
import { generateWeaponFind, isArmoryFull } from './armory';

/**
 * Generate a single travel event for Pro mode.
 * Returns at most one event — first check that fires wins.
 */
export function generateProTravelEvents(
  state: ProGameState,
  destination: LocationName
): GameEvent[] {
  const rng = createTravelRNG(
    state.seed,
    state.currentDay + 1,
    state.currentDistrict,
    destination
  );

  // --- Encounter check (police/DEA/SWAT) ---
  const encounterChance = getEncounterChance(state, destination);
  if (rng.chance(encounterChance)) {
    const encounterType = determineEncounterType(state, rng);

    const encounterMessages = {
      police: 'Officer Hardass is chasing you!',
      dea: 'DEA agents have you surrounded!',
      swat: 'SWAT team is closing in!',
    };

    const eventType = encounterType === 'police'
      ? 'police_encounter' as const
      : encounterType === 'dea'
        ? 'dea_encounter' as const
        : 'swat_encounter' as const;

    return [{
      type: eventType,
      message: encounterMessages[encounterType],
      encounterType,
    }];
  }

  // --- Mugging: 1 in 15 ---
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

  // --- Find drugs on the ground: 1 in 12 ---
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

  // --- Find weapon (single roll system) ---
  const weaponFind = generateWeaponFind(state, rng);
  if (weaponFind) {
    if (isArmoryFull(state)) {
      return [{
        type: 'find_weapon',
        message: `You found a ${weaponFind.name}! But your armory is full (10/10). Swap or leave it?`,
        weapon: weaponFind,
      }];
    } else {
      return [{
        type: 'find_weapon',
        message: `You found a ${weaponFind.name}!`,
        weapon: weaponFind,
      }];
    }
  }

  // --- Tiered stash find: 1 in 10 (once per game) ---
  if (!state.stashFound && rng.chance(STASH_FIND_CHANCE)) {
    const totalWeight = STASH_FIND_TIERS.reduce((s, t) => s + t.weight, 0);
    let roll = rng.nextInt(0, totalWeight - 1);
    let tier = STASH_FIND_TIERS[0];
    for (const t of STASH_FIND_TIERS) {
      roll -= t.weight;
      if (roll < 0) { tier = t; break; }
    }
    return [{
      type: tier.type,
      message: `You found a ${tier.name}! (+${tier.bonus} stash space)`,
      spaceChange: tier.bonus,
    }];
  }

  // --- Loan shark goons: debt > 10K and 1 in 8 ---
  if (state.debt > 10000 && rng.chance(8)) {
    const damage = rng.nextInt(5, 15);
    return [{
      type: 'loan_shark_goons',
      message: `The loan shark's goons beat you up for not paying! (-${damage} health)`,
      healthChange: -damage,
    }];
  }

  // --- Pro-exclusive events ---
  const inventoryValue = state.inventory.reduce((sum, slot) => {
    const price = state.market[slot.drug] ?? slot.avgBuyPrice;
    return sum + price * slot.quantity;
  }, 0);
  const netWorth = state.cash + state.bank - state.debt + inventoryValue;

  // Celebrity Buyer: net worth >= $50K, has inventory, 1/20
  if (
    netWorth >= PRO_EVENT_THRESHOLDS.celebrityBuyer.minNetWorth &&
    state.inventory.length > 0 &&
    rng.chance(PRO_EVENT_THRESHOLDS.celebrityBuyer.chance)
  ) {
    const slot = rng.pick(state.inventory);
    const sellQty = Math.min(slot.quantity, rng.nextInt(1, 5));
    const marketPrice = state.market[slot.drug] ?? slot.avgBuyPrice;
    return [{
      type: 'celebrity_buyer',
      message: `A celebrity wants to buy ${sellQty} ${slot.drug} at ${CELEBRITY_BUYER_PRICE_MULTIPLIER}x market price!`,
      drug: slot.drug,
      quantity: sellQty,
      unitPrice: marketPrice,
    }];
  }

  // Rival Dealers: net worth >= $30K, 1/18
  if (
    netWorth >= PRO_EVENT_THRESHOLDS.rivalDealers.minNetWorth &&
    rng.chance(PRO_EVENT_THRESHOLDS.rivalDealers.chance)
  ) {
    const damage = rng.nextInt(5, 15);
    const cashLoss = Math.floor(state.cash * (rng.nextInt(5, 10) / 100));
    return [{
      type: 'rival_dealers',
      message: `Rival dealers jumped you! (-${damage} HP, -$${cashLoss.toLocaleString()})`,
      healthChange: -damage,
      cashChange: -cashLoss,
    }];
  }

  // Cartel Offer: in Medellin, 1/10
  if (
    destination === PRO_EVENT_THRESHOLDS.cartelOffer.location &&
    rng.chance(PRO_EVENT_THRESHOLDS.cartelOffer.chance)
  ) {
    const qty = rng.nextInt(5, 15);
    return [{
      type: 'cartel_offer',
      message: `The cartel offers you ${qty} free Cocaine!`,
      drug: 'Cocaine',
      quantity: qty,
    }];
  }

  // Territory Dispute: assets >= 2, 1/30
  if (
    state.assets.length >= PRO_EVENT_THRESHOLDS.territoryDispute.minAssets &&
    rng.chance(PRO_EVENT_THRESHOLDS.territoryDispute.chance)
  ) {
    const cashLoss = Math.floor(state.cash * 0.10);
    return [{
      type: 'territory_dispute',
      message: `Territory dispute! You lost $${cashLoss.toLocaleString()} settling it.`,
      cashChange: -cashLoss,
    }];
  }

  return [];
}

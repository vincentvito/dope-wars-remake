import type { ProGameState, DrugName } from './types';
import {
  LAB_CUT_MULTIPLIER,
  LAB_CUT_BUST_CHANCE,
  LAB_BUST_DRUG_LOSS,
  CUTTABLE_DRUGS,
} from './pro-constants';
import { SeededRNG } from './rng';
import { hasAsset } from './assets';

/**
 * Initiate drug cutting. Moves the game to the 'lab' phase.
 * Requires the Lab asset.
 */
export function initiateCutting(
  state: ProGameState,
  drug: DrugName,
  cutPercentage: number
): ProGameState {
  if (!hasAsset(state, 'Lab')) {
    throw new Error('Cannot cut drugs without a Lab');
  }

  if (state.labState !== null) {
    throw new Error('Already have an active lab operation');
  }

  if (!CUTTABLE_DRUGS.has(drug)) {
    throw new Error(`${drug} cannot be cut`);
  }

  const slot = state.inventory.find((s) => s.drug === drug);
  if (!slot || slot.quantity <= 0) {
    throw new Error(`No ${drug} in inventory to cut`);
  }

  if (!(cutPercentage in LAB_CUT_MULTIPLIER)) {
    throw new Error(`Invalid cut percentage: ${cutPercentage}`);
  }

  return {
    ...state,
    phase: 'lab',
    labState: {
      drug,
      originalQuantity: slot.quantity,
      cutPercentage,
    },
  };
}

/**
 * Confirm drug cutting. Resolves the cut via seeded RNG.
 * Success: multiply quantity in inventory.
 * Bust: lose 50% of drug, trigger DEA combat (phase → 'loadout' or 'combat').
 */
export function confirmCutting(state: ProGameState): ProGameState {
  if (!state.labState) {
    throw new Error('No active lab operation to confirm');
  }

  const { drug, originalQuantity, cutPercentage } = state.labState;
  const rng = new SeededRNG(`${state.seed}-lab-day${state.currentDay}-${drug}-${cutPercentage}`);

  // Determine bust chance
  const bustChanceN = LAB_CUT_BUST_CHANCE[cutPercentage];

  const isBust = rng.chance(bustChanceN);

  if (isBust) {
    return resolveBust(state, drug, originalQuantity);
  }

  return resolveSuccessfulCut(state, drug, originalQuantity, cutPercentage);
}

/**
 * Cancel drug cutting. Returns to market phase.
 */
export function cancelCutting(state: ProGameState): ProGameState {
  if (!state.labState) {
    throw new Error('No active lab operation to cancel');
  }

  return {
    ...state,
    phase: 'market',
    labState: null,
  };
}

/**
 * Resolve a successful drug cut.
 */
function resolveSuccessfulCut(
  state: ProGameState,
  drug: DrugName,
  originalQuantity: number,
  cutPercentage: number
): ProGameState {
  const multiplier = LAB_CUT_MULTIPLIER[cutPercentage];

  const newQuantity = Math.floor(originalQuantity * multiplier);
  const addedQuantity = newQuantity - originalQuantity;

  // Check if there's space in inventory
  const usedSpace = state.inventory.reduce((sum, s) => sum + s.quantity, 0);
  const availableSpace = state.trenchcoatSpace - usedSpace + originalQuantity; // originalQuantity is already counted
  const actualNew = Math.min(newQuantity, availableSpace);

  return {
    ...state,
    phase: 'market',
    labState: null,
    totalDrugsCut: state.totalDrugsCut + addedQuantity,
    inventory: state.inventory.map((s) =>
      s.drug === drug ? { ...s, quantity: actualNew } : s
    ),
  };
}

/**
 * Resolve a lab bust: lose 50% of the drug, trigger DEA combat.
 */
function resolveBust(
  state: ProGameState,
  drug: DrugName,
  originalQuantity: number
): ProGameState {
  const lostQuantity = Math.floor(originalQuantity * LAB_BUST_DRUG_LOSS);
  const remainingQuantity = originalQuantity - lostQuantity;

  let newInventory = state.inventory.map((s) =>
    s.drug === drug ? { ...s, quantity: remainingQuantity } : s
  ).filter((s) => s.quantity > 0);

  // DEA combat will be initiated by the game loop (pro-game.ts) when it sees
  // labState bust result. We signal this by setting phase to 'loadout' or 'combat'.
  const nextPhase = 'combat';

  return {
    ...state,
    phase: nextPhase as ProGameState['phase'],
    labState: null,
    inventory: newInventory,
    // proCombat will be set by the game loop when it processes the bust
  };
}

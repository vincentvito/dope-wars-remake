import type {
  ProGameState,
  ProPlayerAction,
  GameMode,
  LocationName,
  GameEvent,
  EncounterType,
  Weapon,
} from './types';
import {
  STARTING_CASH,
  STARTING_DEBT,
  STARTING_HEALTH,
  STARTING_TRENCHCOAT_SPACE,
  STARTING_DISTRICT,
  MAX_DAYS,
  LOAN_SHARK_INTEREST_RATE,
} from './constants';
import { WEAPON_DEFINITIONS, LAB_REPUTATION_CHANCE, LAB_REPUTATION_PENALTY } from './pro-constants';
import { generateProMarketPrices } from './pro-market';
import { generateProTravelEvents } from './pro-events';
import { initProCombat, resolveProFight, resolveProRun, determineEncounterType } from './pro-combat';
import { buyAsset, processPlantation } from './assets';
import { initiateCutting, confirmCutting, cancelCutting } from './lab';
import { addWeapon, discardWeapon, selectLoadout, autoReplaceWeakest } from './armory';
import { getEffectiveTravelCost } from './cities';
import { isValidProAction } from './state-machine';
import { SeededRNG } from './rng';

/**
 * Check if a game mode is Pro.
 */
export function isProMode(mode: GameMode): boolean {
  return mode.startsWith('pro_');
}

/**
 * Create a new Pro game with the given seed and mode.
 */
export function createProGame(seed: string, gameMode: GameMode): ProGameState {
  const maxDays = MAX_DAYS[gameMode] ?? 31;
  const { prices, events } = generateProMarketPrices(seed, 1, STARTING_DISTRICT);

  return {
    seed,
    gameMode,
    currentDay: 1,
    maxDays,
    currentDistrict: STARTING_DISTRICT,
    cash: STARTING_CASH,
    bank: 0,
    debt: STARTING_DEBT,
    inventory: [],
    trenchcoatSpace: STARTING_TRENCHCOAT_SPACE,
    stashFound: false,
    guns: 0, // Always 0 in Pro; armory replaces this
    health: STARTING_HEALTH,
    market: prices,
    marketEvents: events,
    activeEvent: null,
    combat: null,
    phase: 'market',
    actionLog: [],

    // Pro-specific fields
    assets: [],
    armory: [],
    labState: null,
    proCombat: null,
    plantationBuffer: [],
    deaSurvived: 0,
    totalDrugsSold: 0,
    totalDrugsCut: 0,
  };
}

/**
 * Apply a Pro player action to the game state.
 * Main dispatch function for Pro mode.
 */
export function applyProAction(state: ProGameState, action: ProPlayerAction): ProGameState {
  if (!isValidProAction(state.phase, action.type)) {
    throw new Error(`Invalid action "${action.type}" in phase "${state.phase}"`);
  }

  // Record action in the log
  const stateWithLog: ProGameState = {
    ...state,
    actionLog: [...state.actionLog, action],
  };

  switch (action.type) {
    case 'BUY':
      return proExecuteBuy(stateWithLog, action.drug, action.quantity);
    case 'SELL':
      return proExecuteSell(stateWithLog, action.drug, action.quantity);
    case 'TRAVEL':
      return handleProTravel(stateWithLog, action.destination);
    case 'BANK_DEPOSIT':
      return proDeposit(stateWithLog, action.amount);
    case 'BANK_WITHDRAW':
      return proWithdraw(stateWithLog, action.amount);
    case 'PAY_DEBT':
      return proPayDebt(stateWithLog, action.amount);
    case 'COMBAT_FIGHT': {
      // If player has weapons but no loadout selected, redirect to loadout screen first
      if (
        stateWithLog.armory.length > 0 &&
        stateWithLog.proCombat &&
        stateWithLog.proCombat.selectedLoadout.length === 0
      ) {
        return { ...stateWithLog, phase: 'loadout' };
      }
      return resolveProFight(stateWithLog);
    }
    case 'COMBAT_RUN':
      return resolveProRun(stateWithLog);
    case 'EVENT_ACCEPT':
      return handleProEventResponse(stateWithLog, true);
    case 'EVENT_DECLINE':
      return handleProEventResponse(stateWithLog, false);
    case 'BUY_ASSET':
      return buyAsset(stateWithLog, action.assetType);
    case 'CUT_DRUGS':
      return initiateCutting(stateWithLog, action.drug, action.cutPercentage);
    case 'LAB_CONFIRM':
      return handleLabConfirm(stateWithLog);
    case 'LAB_CANCEL':
      return cancelCutting(stateWithLog);
    case 'SELECT_LOADOUT': {
      const withLoadout = selectLoadout(stateWithLog, action.weaponIndices);
      // After selecting loadout, immediately resolve first fight round
      return resolveProFight(withLoadout);
    }
    case 'DISCARD_WEAPON':
      return discardWeapon(stateWithLog, action.weaponIndex);
    default:
      return stateWithLog;
  }
}

/**
 * Handle Pro travel. Order:
 * 1. Accrue loan interest
 * 2. Deduct travel cost (after Plane reduction)
 * 3. Advance day
 * 4. Process Plantation (flush buffer → produce → overflow)
 * 5. Check game over (reached max days)
 * 6. Generate pro travel events (encounter/event/market)
 */
function handleProTravel(state: ProGameState, destination: LocationName): ProGameState {
  if (destination === state.currentDistrict) {
    throw new Error('Cannot travel to your current location');
  }

  // 1. Accrue loan shark interest
  let newState = proAccrueInterest(state);

  // 2. Deduct travel cost
  const travelCost = getEffectiveTravelCost(newState, destination);
  if (travelCost > newState.cash) {
    throw new Error(`Not enough cash for travel. Need $${travelCost}, have $${newState.cash}`);
  }
  newState = { ...newState, cash: newState.cash - travelCost };

  // 3. Advance day
  const newDay = newState.currentDay + 1;
  newState = {
    ...newState,
    currentDay: newDay,
    currentDistrict: destination,
    activeEvent: null,
    combat: null,
    proCombat: null,
  };

  // 4. Process Plantation
  newState = processPlantation(newState);

  // 5. Check game over
  if (newDay >= state.maxDays) {
    return {
      ...newState,
      market: {},
      marketEvents: [],
      phase: 'game_over',
    };
  }

  // 6. Generate pro travel events
  const events = generateProTravelEvents(state, destination);

  if (events.length > 0) {
    const firstEvent = events[0];

    // Encounter events start combat flow
    if (
      firstEvent.type === 'police_encounter' ||
      firstEvent.type === 'dea_encounter' ||
      firstEvent.type === 'swat_encounter'
    ) {
      const encounterType = firstEvent.encounterType ?? 'police';
      const rng = new SeededRNG(`${newState.seed}-combat-day${newDay}`);
      const proCombat = initProCombat(newState, encounterType, rng);

      // Always show combat dialog first; loadout selection happens when player clicks Fight
      const nextPhase = 'combat';

      return {
        ...newState,
        proCombat,
        activeEvent: firstEvent,
        market: {},
        marketEvents: [],
        phase: nextPhase,
      };
    }

    // Other events get shown to the player
    return {
      ...newState,
      activeEvent: firstEvent,
      market: {},
      marketEvents: [],
      phase: 'event',
    };
  }

  // No events — arrive at destination with fresh market
  const { prices, events: marketEvents } = generateProMarketPrices(
    state.seed,
    newDay,
    destination
  );

  return {
    ...newState,
    market: prices,
    marketEvents,
    phase: 'market',
  };
}

/**
 * Handle the player's response to a Pro event.
 */
function handleProEventResponse(state: ProGameState, accept: boolean): ProGameState {
  if (!state.activeEvent) {
    throw new Error('No active event to respond to');
  }

  let newState: ProGameState;
  const event = state.activeEvent;

  if (accept) {
    newState = applyProEventEffects(state, event);
  } else {
    newState = { ...state };
  }

  // Clear the event
  newState = { ...newState, activeEvent: null };

  // If the event killed the player, game over
  if (newState.health <= 0) {
    return { ...newState, phase: 'game_over' };
  }

  // Generate market for the new location
  const { prices, events: marketEvents } = generateProMarketPrices(
    newState.seed,
    newState.currentDay,
    newState.currentDistrict
  );

  return {
    ...newState,
    market: prices,
    marketEvents,
    phase: 'market',
  };
}

/**
 * Apply Pro event effects to game state.
 */
function applyProEventEffects(state: ProGameState, event: GameEvent): ProGameState {
  let newState = { ...state };

  if (event.cashChange) {
    newState.cash = Math.max(0, newState.cash + event.cashChange);
  }

  if (event.healthChange) {
    newState.health = Math.max(0, Math.min(100, newState.health + event.healthChange));
  }

  if (event.spaceChange) {
    newState.trenchcoatSpace = newState.trenchcoatSpace + event.spaceChange;
    const stashEventTypes = ['find_trenchcoat', 'find_suitcase', 'find_backpack', 'find_duffel'];
    if (stashEventTypes.includes(event.type)) {
      newState.stashFound = true;
    }
  }

  // Find drugs: add to inventory if space
  if ((event.type === 'find_drugs' || event.type === 'cartel_offer') && event.drug && event.quantity) {
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
          { drug: event.drug!, quantity: quantityToAdd, avgBuyPrice: newState.market[event.drug!] ?? 0 },
        ];
      }
    }
  }

  // Find weapon: add to armory
  if (event.type === 'find_weapon' && event.weapon) {
    if (newState.armory.length < 10) {
      newState = addWeapon(newState, event.weapon);
    }
    // If armory full, the UI will handle swap — for accept, we do nothing here
    // (the swap is handled via DISCARD_WEAPON + separate event acceptance)
  }

  // Celebrity buyer: sell drug at 3x
  if (event.type === 'celebrity_buyer' && event.drug && event.quantity) {
    const slot = newState.inventory.find((s) => s.drug === event.drug);
    if (slot) {
      const sellQty = Math.min(event.quantity, slot.quantity);
      const unitPrice = event.unitPrice ?? newState.market[event.drug] ?? slot.avgBuyPrice;
      const revenue = unitPrice * 3 * sellQty;

      newState.cash += revenue;
      newState.totalDrugsSold += sellQty;
      newState.inventory = newState.inventory
        .map((s) => s.drug === event.drug ? { ...s, quantity: s.quantity - sellQty } : s)
        .filter((s) => s.quantity > 0);
    }
  }

  // Check for death
  if (newState.health <= 0) {
    newState.phase = 'game_over';
  }

  return newState;
}

/**
 * Handle lab confirmation with DEA bust combat initiation
 * and reputation penalty on successful cuts.
 */
function handleLabConfirm(state: ProGameState): ProGameState {
  // Save lab state before confirmCutting clears it
  const labDrug = state.labState?.drug;
  const labCutPercent = state.labState?.cutPercentage;

  const result = confirmCutting(state);

  // If the cut resulted in a bust (phase is 'loadout' or 'combat'), init DEA combat
  if (result.phase === 'combat' && !result.proCombat) {
    const rng = new SeededRNG(`${result.seed}-labbust-day${result.currentDay}`);
    const proCombat = initProCombat(result, 'dea', rng);

    return {
      ...result,
      proCombat,
      activeEvent: {
        type: 'dea_encounter',
        message: 'Your lab was raided! DEA agents burst in!',
        encounterType: 'dea',
      },
    };
  }

  // Successful cut — roll for reputation penalty
  if (result.phase === 'market' && labDrug && labCutPercent != null) {
    const rng = new SeededRNG(`${result.seed}-labrep-day${result.currentDay}-${labDrug}`);

    if (rng.chance(LAB_REPUTATION_CHANCE)) {
      const penalty = LAB_REPUTATION_PENALTY[labCutPercent];
      if (penalty) {
        const cashLoss = Math.floor(result.cash * penalty.cashPercent);
        const newHealth = Math.max(1, result.health - penalty.healthLoss);

        return {
          ...result,
          cash: result.cash - cashLoss,
          health: newHealth,
          phase: 'event',
          activeEvent: {
            type: 'reputation_penalty',
            message: `Your regular customers beat you up after finding out you cut the ${labDrug}! (-$${cashLoss.toLocaleString()}, -${penalty.healthLoss} HP)`,
          },
        };
      }
    }
  }

  return result;
}

/**
 * Calculate Pro net worth.
 */
export function calculateProNetWorth(state: ProGameState): number {
  const inventoryValue = state.inventory.reduce((sum, slot) => {
    const price = state.market[slot.drug] ?? slot.avgBuyPrice;
    return sum + price * slot.quantity;
  }, 0);

  return state.cash + state.bank - state.debt + inventoryValue;
}

// ============================================================
// Inline finance operations (avoids GameState/ProGameState mismatch)
// ============================================================

function proAccrueInterest(state: ProGameState): ProGameState {
  if (state.debt <= 0) return state;
  const interest = Math.floor(state.debt * LOAN_SHARK_INTEREST_RATE);
  return { ...state, debt: state.debt + interest };
}

function proDeposit(state: ProGameState, amount: number): ProGameState {
  if (amount <= 0) throw new Error('Deposit amount must be positive');
  if (amount > state.cash) throw new Error(`Cannot deposit $${amount}. Available cash: $${state.cash}`);
  return { ...state, cash: state.cash - amount, bank: state.bank + amount };
}

function proWithdraw(state: ProGameState, amount: number): ProGameState {
  if (amount <= 0) throw new Error('Withdrawal amount must be positive');
  if (amount > state.bank) throw new Error(`Cannot withdraw $${amount}. Bank balance: $${state.bank}`);
  return { ...state, cash: state.cash + amount, bank: state.bank - amount };
}

function proPayDebt(state: ProGameState, amount: number): ProGameState {
  if (amount <= 0) throw new Error('Payment amount must be positive');
  if (amount > state.cash) throw new Error(`Cannot pay $${amount}. Available cash: $${state.cash}`);
  const payment = Math.min(amount, state.debt);
  return { ...state, cash: state.cash - payment, debt: state.debt - payment };
}

/**
 * Inline buy for Pro mode.
 */
function proExecuteBuy(state: ProGameState, drug: string, quantity: number): ProGameState {
  const drugName = drug as ProGameState['inventory'][0]['drug'];
  const price = state.market[drugName];
  if (price == null) throw new Error(`${drug} is not available at this market`);
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const totalCost = price * quantity;
  if (totalCost > state.cash) throw new Error(`Not enough cash. Need $${totalCost}, have $${state.cash}`);

  const usedSpace = state.inventory.reduce((sum, s) => sum + s.quantity, 0);
  const availableSpace = state.trenchcoatSpace - usedSpace;
  if (quantity > availableSpace) throw new Error(`Not enough space. Need ${quantity}, have ${availableSpace}`);

  const existing = state.inventory.find((s) => s.drug === drugName);
  let newInventory: typeof state.inventory;

  if (existing) {
    const totalQty = existing.quantity + quantity;
    const newAvgPrice = Math.floor(
      (existing.avgBuyPrice * existing.quantity + price * quantity) / totalQty
    );
    newInventory = state.inventory.map((s) =>
      s.drug === drugName ? { ...s, quantity: totalQty, avgBuyPrice: newAvgPrice } : s
    );
  } else {
    newInventory = [...state.inventory, { drug: drugName, quantity, avgBuyPrice: price }];
  }

  return { ...state, cash: state.cash - totalCost, inventory: newInventory };
}

/**
 * Inline sell for Pro mode. Tracks totalDrugsSold.
 */
function proExecuteSell(state: ProGameState, drug: string, quantity: number): ProGameState {
  const drugName = drug as ProGameState['inventory'][0]['drug'];
  const price = state.market[drugName];
  if (price == null) throw new Error(`${drug} is not available at this market`);
  if (quantity <= 0) throw new Error('Quantity must be positive');

  const slot = state.inventory.find((s) => s.drug === drugName);
  if (!slot || slot.quantity < quantity) {
    throw new Error(`Not enough ${drug}. Have ${slot?.quantity ?? 0}, trying to sell ${quantity}`);
  }

  const totalRevenue = price * quantity;
  const remainingQty = slot.quantity - quantity;
  const newInventory = remainingQty > 0
    ? state.inventory.map((s) => s.drug === drugName ? { ...s, quantity: remainingQty } : s)
    : state.inventory.filter((s) => s.drug !== drugName);

  return {
    ...state,
    cash: state.cash + totalRevenue,
    inventory: newInventory,
    totalDrugsSold: state.totalDrugsSold + quantity,
  };
}

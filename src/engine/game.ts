import type { GameState, PlayerAction, DistrictName, DrugName, GameMode } from './types';
import {
  STARTING_CASH,
  STARTING_DEBT,
  STARTING_HEALTH,
  STARTING_TRENCHCOAT_SPACE,
  STARTING_DISTRICT,
  MAX_DAYS,
} from './constants';
import { generateMarketPrices } from './market';
import { generateTravelEvents, applyEventEffects } from './events';
import { initCombat, resolveFight, resolveRun } from './combat';
import { executeBuy, executeSell } from './inventory';
import { deposit, withdraw, payDebt, accrueInterest } from './finance';
import { isValidAction } from './state-machine';

/**
 * Create a new game with the given seed and mode.
 */
export function createNewGame(seed: string, gameMode: GameMode = '30'): GameState {
  const maxDays = MAX_DAYS[gameMode] ?? 31;

  const { prices, events } = generateMarketPrices(seed, 1, STARTING_DISTRICT);

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
    guns: 0,
    health: STARTING_HEALTH,
    market: prices,
    marketEvents: events,
    activeEvent: null,
    combat: null,
    phase: 'market',
    actionLog: [],
  };
}

/**
 * Apply a player action to the game state.
 * This is the main dispatch function — all game logic flows through here.
 */
export function applyAction(state: GameState, action: PlayerAction): GameState {
  if (!isValidAction(state.phase, action.type)) {
    throw new Error(`Invalid action "${action.type}" in phase "${state.phase}"`);
  }

  // Record action in the log (for replay validation)
  const stateWithLog: GameState = {
    ...state,
    actionLog: [...state.actionLog, action],
  };

  switch (action.type) {
    case 'BUY':
      return executeBuy(stateWithLog, action.drug, action.quantity);
    case 'SELL':
      return executeSell(stateWithLog, action.drug, action.quantity);
    case 'TRAVEL':
      return handleTravel(stateWithLog, action.destination);
    case 'BANK_DEPOSIT':
      return deposit(stateWithLog, action.amount);
    case 'BANK_WITHDRAW':
      return withdraw(stateWithLog, action.amount);
    case 'PAY_DEBT':
      return payDebt(stateWithLog, action.amount);
    case 'COMBAT_FIGHT':
      return resolveFight(stateWithLog);
    case 'COMBAT_RUN':
      return resolveRun(stateWithLog);
    case 'EVENT_ACCEPT':
      return handleEventResponse(stateWithLog, true);
    case 'EVENT_DECLINE':
      return handleEventResponse(stateWithLog, false);
    default:
      return stateWithLog;
  }
}

/**
 * Handle travel to a new district.
 * Advances the day, accrues interest, generates events, and sets up the new market.
 */
function handleTravel(state: GameState, destination: DistrictName): GameState {
  if (destination === state.currentDistrict) {
    throw new Error('Cannot travel to your current district');
  }

  const newDay = state.currentDay + 1;

  // Accrue loan shark interest before advancing
  let newState = accrueInterest(state);

  newState = {
    ...newState,
    currentDay: newDay,
    currentDistrict: destination,
    activeEvent: null,
    combat: null,
  };

  // Check if game is over (reached max days)
  if (newDay >= state.maxDays) {
    return {
      ...newState,
      market: {},
      marketEvents: [],
      phase: 'game_over',
    };
  }

  // Generate travel events
  const events = generateTravelEvents(state, destination);

  if (events.length > 0) {
    const firstEvent = events[0];

    // Police encounter starts combat immediately
    if (firstEvent.type === 'police_encounter') {
      const combat = initCombat(newState);
      return {
        ...newState,
        combat,
        activeEvent: firstEvent,
        market: {},
        marketEvents: [],
        phase: 'combat',
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
  const { prices, events: marketEvents } = generateMarketPrices(
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
 * Handle the player's response to a random event.
 */
function handleEventResponse(state: GameState, accept: boolean): GameState {
  if (!state.activeEvent) {
    throw new Error('No active event to respond to');
  }

  let newState: GameState;

  if (accept) {
    // Apply the event's effects
    newState = applyEventEffects(state, state.activeEvent);
  } else {
    newState = { ...state };
  }

  // Clear the event
  newState = {
    ...newState,
    activeEvent: null,
  };

  // If the event killed the player, game over
  if (newState.health <= 0) {
    return { ...newState, phase: 'game_over' };
  }

  // Generate market for the new location
  const { prices, events: marketEvents } = generateMarketPrices(
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
 * Calculate the player's net worth at the current state.
 */
export function calculateNetWorth(state: GameState): number {
  const inventoryValue = state.inventory.reduce((sum, slot) => {
    // Use market price if available, otherwise use avg buy price
    const price = state.market[slot.drug] ?? slot.avgBuyPrice;
    return sum + price * slot.quantity;
  }, 0);

  return state.cash + state.bank - state.debt + inventoryValue;
}

/**
 * Get the used inventory space.
 */
export function getUsedInventorySpace(state: GameState): number {
  return state.inventory.reduce((sum, slot) => sum + slot.quantity, 0);
}

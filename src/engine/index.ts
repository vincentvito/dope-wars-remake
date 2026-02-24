// Public API for the game engine
export { createNewGame, applyAction, calculateNetWorth, getUsedInventorySpace } from './game';
export { replayGame } from './replay';
export { getMaxBuyQuantity, getUsedSpace } from './inventory';
export { generateMarketPrices } from './market';
export { SeededRNG, createDayRNG, createTravelRNG } from './rng';

// Re-export types
export type {
  GameState,
  GamePhase,
  GameMode,
  PlayerAction,
  DrugName,
  DistrictName,
  DrugDefinition,
  DistrictDefinition,
  MarketPrices,
  MarketEvent,
  InventorySlot,
  GameEvent,
  CombatState,
  // Pro mode types
  LocationName,
  AssetType,
  WeaponTier,
  EncounterType,
  CityDefinition,
  AssetDefinition,
  OwnedAsset,
  LabState,
  WeaponDefinition,
  Weapon,
  ProCombatState,
  ProPlayerAction,
  ProGameState,
} from './types';

// Re-export constants
export {
  DRUGS,
  DRUG_MAP,
  DISTRICTS,
  DISTRICT_NAMES,
  DISTRICT_MAP,
  STARTING_CASH,
  STARTING_DEBT,
  STARTING_HEALTH,
  STARTING_TRENCHCOAT_SPACE,
  STARTING_DISTRICT,
  LOAN_SHARK_INTEREST_RATE,
  MAX_GUNS,
  GUN_PRICE,
  MAX_DAYS,
} from './constants';

// Pro mode exports
export { createProGame, applyProAction, calculateProNetWorth, isProMode } from './pro-game';
export { replayProGame } from './pro-replay';
export { generateProMarketPrices } from './pro-market';
export { buyAsset, hasAsset } from './assets';
export { initiateCutting, confirmCutting, cancelCutting } from './lab';
export {
  addWeapon, discardWeapon, swapWeapon, autoReplaceWeakest,
  selectLoadout, getLoadoutDamageBonus, getLoadoutRunPenalty,
  generateWeaponFind, isArmoryFull, getWeaponDefinition,
} from './armory';
export {
  canTravelTo, getEffectiveTravelCost, getAvailableDestinations,
  getPriceModifier, meetsUnlockRequirements, getLocationDangerLevel, isCity,
} from './cities';
export {
  getEncounterChance, determineEncounterType, initProCombat,
  resolveProFight, resolveProRun,
} from './pro-combat';
export { generateProTravelEvents } from './pro-events';
export { isValidAction, isValidProAction, isValidTransition } from './state-machine';

// Pro constants
export {
  CITIES, CITY_MAP, ALL_LOCATIONS,
  ASSET_DEFINITIONS, ASSET_MAP,
  WEAPON_DEFINITIONS, MAX_ARMORY_SIZE, MAX_LOADOUT_SIZE,
  WEAPON_FIND_BASE_CHANCE,
  LAB_CUT_OPTIONS, LAB_CUT_MULTIPLIER, LAB_CUT_BUST_CHANCE,
  ENCOUNTER_STATS, STASH_FIND_CHANCE, STASH_FIND_TIERS,
} from './pro-constants';

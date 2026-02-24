// ============================================================
// Core Game Types
// ============================================================

export type DrugName =
  | 'Cocaine'
  | 'Hashish'
  | 'Heroin'
  | 'Ecstasy'
  | 'Smack'
  | 'Opium'
  | 'Crack'
  | 'Peyote'
  | 'Shrooms'
  | 'Speed'
  | 'Weed';

export type DistrictName =
  | 'Bronx'
  | 'Ghetto'
  | 'Central Park'
  | 'Manhattan'
  | 'Coney Island'
  | 'Brooklyn';

export type GameMode = '30' | 'pro_30' | 'pro_45' | 'pro_60';

export type GamePhase =
  | 'market'
  | 'traveling'
  | 'event'
  | 'combat'
  | 'lab'
  | 'loadout'
  | 'game_over';

// ============================================================
// Drug & District Definitions
// ============================================================

export interface DrugDefinition {
  name: DrugName;
  minPrice: number;
  maxPrice: number;
  /** Multiplier applied during price spike events */
  spikeMultiplier: number;
  /** Divisor applied during price crash events */
  crashDivisor: number;
  /** 1-in-N chance of a price spike per market generation */
  spikeChance: number;
  /** 1-in-N chance of a price crash per market generation */
  crashChance: number;
}

export interface DistrictDefinition {
  name: DistrictName;
  /** Affects police encounter frequency (1 = safest, 5 = most dangerous) */
  dangerLevel: number;
}

// ============================================================
// Market
// ============================================================

/** Maps drug name to price, or null if unavailable this turn */
export type MarketPrices = Partial<Record<DrugName, number>>;

export interface MarketEvent {
  type: 'price_spike' | 'price_crash';
  drug: DrugName;
  message: string;
}

// ============================================================
// Inventory
// ============================================================

export interface InventorySlot {
  drug: DrugName;
  quantity: number;
  /** Weighted average purchase price for P&L tracking */
  avgBuyPrice: number;
}

// ============================================================
// Events
// ============================================================

export type EventType =
  | 'price_spike'
  | 'price_crash'
  | 'police_encounter'
  | 'find_drugs'
  | 'mugging'
  | 'find_gun'
  | 'find_coat'
  | 'loan_shark_goons'
  | 'drug_bust'
  // Pro mode event types
  | 'dea_encounter'
  | 'swat_encounter'
  | 'find_backpack'
  | 'find_duffel'
  | 'find_trenchcoat'
  | 'find_suitcase'
  | 'find_weapon'
  | 'celebrity_buyer'
  | 'rival_dealers'
  | 'cartel_offer'
  | 'territory_dispute'
  | 'reputation_penalty';

export interface GameEvent {
  type: EventType;
  message: string;
  drug?: DrugName;
  quantity?: number;
  cashChange?: number;
  healthChange?: number;
  spaceChange?: number;
  gunsChange?: number;
  // Pro mode extensions
  encounterType?: EncounterType;
  weapon?: Weapon;
  unitPrice?: number;
}

// ============================================================
// Combat
// ============================================================

export interface CombatState {
  officerHealth: number;
  officerMaxHealth: number;
  officerDamage: number;
  roundsElapsed: number;
  lastMessage: string;
}

// ============================================================
// Player Actions (recorded for replay)
// ============================================================

export type PlayerAction =
  | { type: 'BUY'; drug: DrugName; quantity: number }
  | { type: 'SELL'; drug: DrugName; quantity: number }
  | { type: 'TRAVEL'; destination: DistrictName }
  | { type: 'BANK_DEPOSIT'; amount: number }
  | { type: 'BANK_WITHDRAW'; amount: number }
  | { type: 'PAY_DEBT'; amount: number }
  | { type: 'COMBAT_RUN' }
  | { type: 'COMBAT_FIGHT' }
  | { type: 'EVENT_ACCEPT' }
  | { type: 'EVENT_DECLINE' };

// ============================================================
// Game State
// ============================================================

export interface GameState {
  // Identity
  seed: string;
  gameMode: GameMode;

  // Time
  currentDay: number;
  maxDays: number;

  // Location
  currentDistrict: DistrictName;

  // Finances
  cash: number;
  bank: number;
  debt: number;

  // Inventory
  inventory: InventorySlot[];
  trenchcoatSpace: number;
  stashFound: boolean;
  guns: number;

  // Health
  health: number;

  // Market (current location's prices)
  market: MarketPrices;
  marketEvents: MarketEvent[];

  // Active event (pending resolution)
  activeEvent: GameEvent | null;

  // Combat state (pending resolution)
  combat: CombatState | null;

  // Game phase
  phase: GamePhase;

  // Action history (for server replay)
  actionLog: PlayerAction[];
}

// ============================================================
// Pro Mode Types
// ============================================================

export type LocationName = DistrictName | 'Miami' | 'Los Angeles' | 'Medellin';

export type AssetType = 'Lab' | 'Van' | 'Stash House' | 'Warehouse' | 'Plane' | 'Plantation' | 'Submarine';

export type WeaponTier = 'Pistol' | 'SMG' | 'Rifle' | 'Heavy';

export type EncounterType = 'police' | 'dea' | 'swat';

// ============================================================
// Pro Mode — Cities
// ============================================================

export interface CityDefinition {
  name: LocationName;
  dangerLevel: number;
  travelCost: number;
  priceModifiers: Partial<Record<DrugName, number>>;
  unlockRequirements: {
    assets: AssetType[];
  };
}

// ============================================================
// Pro Mode — Assets
// ============================================================

export interface AssetDefinition {
  type: AssetType;
  cost: number;
  stashBonus: number;
  description: string;
}

export interface OwnedAsset {
  type: AssetType;
  purchasedDay: number;
}

// ============================================================
// Pro Mode — Lab
// ============================================================

export interface LabState {
  drug: DrugName;
  originalQuantity: number;
  cutPercentage: number;
}

// ============================================================
// Pro Mode — Armory
// ============================================================

export interface WeaponDefinition {
  name: string;
  tier: WeaponTier;
  damageBonus: number;
  runPenalty: number;
  baseFindChance: number;
  description: string;
}

export interface Weapon {
  name: string;
  tier: WeaponTier;
  foundDay: number;
}

// ============================================================
// Pro Mode — Combat
// ============================================================

export interface ProCombatState extends CombatState {
  encounterType: EncounterType;
  fineRate: number;
  confiscationRate: number;
  selectedLoadout: Weapon[];
}

// ============================================================
// Pro Mode — Actions
// ============================================================

export type ProPlayerAction =
  | { type: 'BUY'; drug: DrugName; quantity: number }
  | { type: 'SELL'; drug: DrugName; quantity: number }
  | { type: 'TRAVEL'; destination: LocationName }
  | { type: 'BANK_DEPOSIT'; amount: number }
  | { type: 'BANK_WITHDRAW'; amount: number }
  | { type: 'PAY_DEBT'; amount: number }
  | { type: 'COMBAT_RUN' }
  | { type: 'COMBAT_FIGHT' }
  | { type: 'EVENT_ACCEPT' }
  | { type: 'EVENT_DECLINE' }
  | { type: 'BUY_ASSET'; assetType: AssetType }
  | { type: 'CUT_DRUGS'; drug: DrugName; cutPercentage: number }
  | { type: 'LAB_CONFIRM' }
  | { type: 'LAB_CANCEL' }
  | { type: 'SELECT_LOADOUT'; weaponIndices: number[] }
  | { type: 'DISCARD_WEAPON'; weaponIndex: number };

// ============================================================
// Pro Mode — Game State
// ============================================================

export interface ProGameState extends Omit<GameState, 'actionLog' | 'currentDistrict'> {
  currentDistrict: LocationName;
  actionLog: ProPlayerAction[];

  // Assets
  assets: OwnedAsset[];

  // Armory (max 10 weapons)
  armory: Weapon[];

  // Lab (pending cut)
  labState: LabState | null;

  // Pro combat (extends base combat)
  proCombat: ProCombatState | null;

  // Plantation overflow buffer (max 50 units)
  plantationBuffer: InventorySlot[];

  // Deferred reputation penalty (applied on next travel arrival)
  pendingReputationPenalty: { drug: DrugName; cutPercentage: number } | null;

  // Tracking
  deaSurvived: number;
  totalDrugsSold: number;
  totalDrugsCut: number;
}

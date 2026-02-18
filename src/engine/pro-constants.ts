import type {
  CityDefinition,
  AssetDefinition,
  AssetType,
  WeaponDefinition,
  LocationName,
  DrugName,
} from './types';

// ============================================================
// City Definitions
// ============================================================

export const CITIES: CityDefinition[] = [
  {
    name: 'Miami',
    dangerLevel: 3,
    travelCost: 2000,
    priceModifiers: { Ecstasy: 0.7, Cocaine: 0.8, Heroin: 1.3 },
    unlockRequirements: { assets: ['Van'] },
  },
  {
    name: 'Los Angeles',
    dangerLevel: 2,
    travelCost: 3000,
    priceModifiers: { Weed: 0.6, Shrooms: 0.7, Cocaine: 1.3 },
    unlockRequirements: { assets: ['Van'] },
  },
  {
    name: 'Medellin',
    dangerLevel: 5,
    travelCost: 5000,
    priceModifiers: { Cocaine: 0.5, Heroin: 0.5, Weed: 1.5 },
    unlockRequirements: { assets: ['Plane'] },
  },
];

export const CITY_MAP: Record<string, CityDefinition> = Object.fromEntries(
  CITIES.map((c) => [c.name, c])
);

export const ALL_LOCATIONS: LocationName[] = [
  'Bronx', 'Ghetto', 'Central Park', 'Manhattan', 'Coney Island', 'Brooklyn',
  'Miami', 'Los Angeles', 'Medellin',
];

// ============================================================
// Asset Definitions
// ============================================================

export const ASSET_DEFINITIONS: AssetDefinition[] = [
  { type: 'Lab',         cost: 50000,   stashBonus: 0,   description: 'Enables drug cutting' },
  { type: 'Van',         cost: 20000,   stashBonus: 75,  description: 'Required for Miami/LA unlock' },
  { type: 'Stash House', cost: 40000,   stashBonus: 150, description: '-50% confiscation' },
  { type: 'Warehouse',   cost: 150000,  stashBonus: 300, description: 'Bulk storage' },
  { type: 'Plane',       cost: 300000,  stashBonus: 0,   description: 'Eliminates inter-city travel costs. Required for Medellin' },
  { type: 'Plantation',  cost: 350000,  stashBonus: 0,   description: 'Produces 2-5 Weed + 1-3 Shrooms/day' },
  { type: 'Submarine',   cost: 1000000, stashBonus: 75,  description: '-20% encounters' },
];

export const ASSET_MAP: Record<AssetType, AssetDefinition> = Object.fromEntries(
  ASSET_DEFINITIONS.map((a) => [a.type, a])
) as Record<AssetType, AssetDefinition>;

// ============================================================
// Armory — Weapon Definitions
// ============================================================

export const WEAPON_DEFINITIONS: WeaponDefinition[] = [
  { name: 'Pistol',            tier: 'Pistol', damageBonus: 5,  runPenalty: 2,  baseFindChance: 1/12, description: 'Basic sidearm' },
  { name: 'Sawed-off Shotgun', tier: 'Pistol', damageBonus: 8,  runPenalty: 3,  baseFindChance: 1/15, description: 'Close-range devastation' },
  { name: 'Uzi',               tier: 'SMG',    damageBonus: 12, runPenalty: 4,  baseFindChance: 1/25, description: 'Spray and pray' },
  { name: 'MAC-10',            tier: 'SMG',    damageBonus: 15, runPenalty: 5,  baseFindChance: 1/30, description: 'Street sweeper' },
  { name: 'AK-47',             tier: 'Rifle',  damageBonus: 22, runPenalty: 7,  baseFindChance: 1/40, description: 'Reliable assault rifle' },
  { name: 'M16',               tier: 'Rifle',  damageBonus: 25, runPenalty: 8,  baseFindChance: 1/50, description: 'Military grade firepower' },
  { name: 'RPG',               tier: 'Heavy',  damageBonus: 40, runPenalty: 12, baseFindChance: 1/80, description: 'Explosive ordnance' },
  { name: 'Minigun',           tier: 'Heavy',  damageBonus: 50, runPenalty: 15, baseFindChance: 1/100, description: 'Maximum firepower' },
];

export const MAX_ARMORY_SIZE = 10;
export const MAX_LOADOUT_SIZE = 3;

/** Base weapon find chance per travel: 1 in N */
export const WEAPON_FIND_BASE_CHANCE = 10; // 1 in 10

/** Weapon tier weights for random selection (higher = more common) */
export const WEAPON_TIER_WEIGHTS: Record<string, number> = {
  Pistol: 50,
  SMG: 30,
  Rifle: 15,
  Heavy: 5,
};

// ============================================================
// Lab Constants
// ============================================================

export const CUTTABLE_DRUGS: ReadonlySet<DrugName> = new Set([
  'Cocaine', 'Heroin', 'Smack', 'Crack', 'Speed',
]);

export const LAB_CUT_OPTIONS = [25, 50, 75, 100] as const;

export const LAB_CUT_MULTIPLIER: Record<number, number> = {
  25: 1.25,
  50: 1.50,
  75: 1.75,
  100: 2.00,
};

export const LAB_CUT_BUST_CHANCE: Record<number, number> = {
  25: 10,  // 1 in 10
  50: 5,   // 1 in 5
  75: 3,   // ~1 in 3
  100: 2,  // ~1 in 2 (but we use 1-in-N, so 1 in 2.5 → use percentage instead)
};

/** Bust: lose 50% of drug being cut */
export const LAB_BUST_DRUG_LOSS = 0.50;

/** Reputation penalty: 1 in N chance after successful cut */
export const LAB_REPUTATION_CHANCE = 3;

/** Reputation penalty scaling by cut percentage */
export const LAB_REPUTATION_PENALTY: Record<number, { cashPercent: number; healthLoss: number }> = {
  25: { cashPercent: 0.04, healthLoss: 6 },
  50: { cashPercent: 0.10, healthLoss: 14 },
  75: { cashPercent: 0.20, healthLoss: 24 },
  100: { cashPercent: 0.30, healthLoss: 36 },
};

// ============================================================
// Plantation Constants
// ============================================================

export const PLANTATION_WEED_MIN = 2;
export const PLANTATION_WEED_MAX = 5;
export const PLANTATION_SHROOMS_MIN = 1;
export const PLANTATION_SHROOMS_MAX = 3;
export const PLANTATION_BUFFER_MAX = 50;

// ============================================================
// Combat — Encounter Constants
// ============================================================

/** Encounter stats by type: [minHP, maxHP, minDmg, maxDmg, fineRate, confiscationRate] */
export const ENCOUNTER_STATS: Record<string, { minHP: number; maxHP: number; minDmg: number; maxDmg: number; fineRate: number; confiscationRate: number }> = {
  police: { minHP: 20, maxHP: 40, minDmg: 3, maxDmg: 8,  fineRate: 0.20, confiscationRate: 0.15 },
  dea:    { minHP: 35, maxHP: 60, minDmg: 6, maxDmg: 12, fineRate: 0.40, confiscationRate: 0.35 },
  swat:   { minHP: 60, maxHP: 80, minDmg: 10, maxDmg: 16, fineRate: 0.50, confiscationRate: 0.50 },
};

/** SWAT: 1-in-8 chance when conditions met */
export const SWAT_CHANCE = 8;
/** SWAT requires 4+ assets */
export const SWAT_MIN_ASSETS = 4;
/** SWAT requires 3+ DEA encounters survived */
export const SWAT_MIN_DEA_SURVIVED = 3;

/** Asset reduction bonuses */
export const SUBMARINE_ENCOUNTER_REDUCTION = 0.20;
export const STASH_HOUSE_CONFISCATION_REDUCTION = 0.50;
export const BONUS_REDUCTION_CAP = 0.80;

// ============================================================
// Pro Event Constants
// ============================================================

export const PRO_EVENT_THRESHOLDS = {
  celebrityBuyer: { minNetWorth: 50000, chance: 20 },
  rivalDealers: { minNetWorth: 30000, chance: 18 },
  cartelOffer: { location: 'Medellin' as LocationName, chance: 10 },
  territoryDispute: { minAssets: 2, chance: 30 },
};

/** Celebrity buyer sells drug at this multiplier */
export const CELEBRITY_BUYER_PRICE_MULTIPLIER = 3;

/** Tiered stash find system — chance and weighted tiers */
export const STASH_FIND_CHANCE = 10; // 1-in-10 per travel
export const STASH_FIND_TIERS = [
  { type: 'find_trenchcoat' as const, name: 'Trenchcoat', bonus: 15,  weight: 50 },
  { type: 'find_suitcase' as const,   name: 'Suitcase',   bonus: 25,  weight: 28 },
  { type: 'find_backpack' as const,   name: 'Backpack',   bonus: 40,  weight: 15 },
  { type: 'find_duffel' as const,     name: 'Duffel Bag', bonus: 60,  weight: 7 },
];

import type { DrugDefinition, DistrictDefinition, DrugName, DistrictName } from './types';

// ============================================================
// Drug Definitions (matching screenshot reference)
// ============================================================

export const DRUGS: DrugDefinition[] = [
  { name: 'Cocaine',  minPrice: 15000, maxPrice: 30000, spikeMultiplier: 4, crashDivisor: 4, spikeChance: 8,  crashChance: 12 },
  { name: 'Hashish',  minPrice: 400,   maxPrice: 1500,  spikeMultiplier: 4, crashDivisor: 4, spikeChance: 15, crashChance: 10 },
  { name: 'Heroin',   minPrice: 5000,  maxPrice: 14000, spikeMultiplier: 4, crashDivisor: 4, spikeChance: 8,  crashChance: 12 },
  { name: 'Ecstasy',  minPrice: 10,    maxPrice: 60,    spikeMultiplier: 8, crashDivisor: 8, spikeChance: 20, crashChance: 10 },
  { name: 'Smack',    minPrice: 1000,  maxPrice: 4500,  spikeMultiplier: 4, crashDivisor: 4, spikeChance: 12, crashChance: 10 },
  { name: 'Opium',    minPrice: 350,   maxPrice: 1000,  spikeMultiplier: 4, crashDivisor: 4, spikeChance: 15, crashChance: 10 },
  { name: 'Crack',    minPrice: 1500,  maxPrice: 4400,  spikeMultiplier: 4, crashDivisor: 4, spikeChance: 12, crashChance: 12 },
  { name: 'Peyote',   minPrice: 200,   maxPrice: 700,   spikeMultiplier: 4, crashDivisor: 4, spikeChance: 15, crashChance: 10 },
  { name: 'Shrooms',  minPrice: 600,   maxPrice: 1350,  spikeMultiplier: 4, crashDivisor: 4, spikeChance: 15, crashChance: 10 },
  { name: 'Speed',    minPrice: 70,    maxPrice: 250,   spikeMultiplier: 4, crashDivisor: 4, spikeChance: 15, crashChance: 10 },
  { name: 'Weed',     minPrice: 300,   maxPrice: 900,   spikeMultiplier: 4, crashDivisor: 4, spikeChance: 15, crashChance: 10 },
];

export const DRUG_MAP: Record<DrugName, DrugDefinition> = Object.fromEntries(
  DRUGS.map((d) => [d.name, d])
) as Record<DrugName, DrugDefinition>;

// ============================================================
// District Definitions
// ============================================================

export const DISTRICTS: DistrictDefinition[] = [
  { name: 'Bronx',        dangerLevel: 3 },
  { name: 'Ghetto',       dangerLevel: 4 },
  { name: 'Central Park', dangerLevel: 2 },
  { name: 'Manhattan',    dangerLevel: 1 },
  { name: 'Coney Island', dangerLevel: 3 },
  { name: 'Brooklyn',     dangerLevel: 2 },
];

export const DISTRICT_NAMES: DistrictName[] = DISTRICTS.map((d) => d.name);

export const DISTRICT_MAP: Record<DistrictName, DistrictDefinition> = Object.fromEntries(
  DISTRICTS.map((d) => [d.name, d])
) as Record<DistrictName, DistrictDefinition>;

// ============================================================
// Game Constants
// ============================================================

export const STARTING_CASH = 2000;
export const STARTING_DEBT = 5000;
export const STARTING_HEALTH = 100;
export const STARTING_TRENCHCOAT_SPACE = 100;
export const STARTING_DISTRICT: DistrictName = 'Bronx';

export const LOAN_SHARK_INTEREST_RATE = 0.10; // 10% per day
export const MAX_GUNS = 5;
export const GUN_PRICE = 400;
export const GUN_DAMAGE_BONUS = 5;
export const COAT_UPGRADE_SPACE = 10;

/** Drug unavailability chance: 1 in N */
export const DRUG_UNAVAILABLE_CHANCE = 8;

/** Max days by game mode */
export const MAX_DAYS: Record<string, number> = {
  '30': 31,
  'pro_30': 31,
  'pro_45': 46,
  'pro_60': 61,
  'pro_90': 91,
};

// ============================================================
// Event Messages
// ============================================================

export const SPIKE_MESSAGES: Partial<Record<DrugName, string[]>> = {
  Cocaine:  ['Cops made a big Cocaine bust! Prices are outrageous!'],
  Heroin:   ['Addicts are buying Heroin at outrageous prices!'],
  Smack:    ['Addicts are buying Smack at crazy prices!'],
  Crack:    ['Crack prices have skyrocketed!'],
  Hashish:  ['The Hashish supply has dried up! Prices soar!'],
  Ecstasy:  ['Club kids are paying insane prices for Ecstasy!'],
  Opium:    ['Opium prices are through the roof!'],
  Peyote:   ['Peyote demand has spiked!'],
  Shrooms:  ['Shrooms are in high demand!'],
  Speed:    ['Speed is selling at premium prices!'],
  Weed:     ['Weed shortage has driven prices sky-high!'],
};

export const CRASH_MESSAGES: Partial<Record<DrugName, string[]>> = {
  Cocaine:  ['Colombians have flooded the market with cheap Cocaine!'],
  Heroin:   ['A rival gang is selling cheap Heroin from a local lab!'],
  Smack:    ['A smuggler has tons of cheap Smack!'],
  Crack:    ['A lab has been dumping cheap Crack on the streets!'],
  Hashish:  ['A caravan from Morocco brings cheap Hashish!'],
  Ecstasy:  ['A warehouse full of Ecstasy was discovered!'],
  Opium:    ['A shipment of cheap Opium has arrived!'],
  Peyote:   ['A big batch of Peyote is going around cheap!'],
  Shrooms:  ['It\'s mushroom season! Cheap Shrooms everywhere!'],
  Speed:    ['A lab bust has flooded the market with cheap Speed!'],
  Weed:     ['A huge crop of Weed has hit the streets!'],
};

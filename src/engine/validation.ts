import { DISTRICT_NAMES, DRUGS } from './constants';
import { ASSET_MAP, LAB_CUT_MULTIPLIER } from './pro-constants';
import type { GameMode, ProPlayerAction } from './types';

export const MAX_ACTIONS = 5000;
export const MAX_SAVE_BYTES = 750_000;
export const GAME_MODES: GameMode[] = ['30', 'pro_30', 'pro_45', 'pro_60'];
const drugs = new Set<string>(DRUGS.map((drug) => drug.name));
const locations = new Set<string>([...DISTRICT_NAMES, 'Miami', 'Los Angeles', 'Medellin']);
const positiveInteger = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const index = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value < 10;

/** Validate untrusted action payloads before any arithmetic or property lookup. */
export function assertAction(action: unknown, pro: boolean): asserts action is ProPlayerAction {
  if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('Invalid action');
  const a = action as Record<string, unknown>;
  let valid = false;
  switch (a.type) {
    case 'BUY': case 'SELL':
      valid = typeof a.drug === 'string' && drugs.has(a.drug) && positiveInteger(a.quantity); break;
    case 'TRAVEL':
      valid = typeof a.destination === 'string' && (pro ? locations.has(a.destination) : DISTRICT_NAMES.some(d => d === a.destination)); break;
    case 'BANK_DEPOSIT': case 'BANK_WITHDRAW': case 'PAY_DEBT':
      valid = positiveInteger(a.amount); break;
    case 'COMBAT_RUN': case 'COMBAT_FIGHT': case 'EVENT_ACCEPT': case 'EVENT_DECLINE':
      valid = true; break;
    case 'BUY_ASSET':
      valid = pro && typeof a.assetType === 'string' && Object.hasOwn(ASSET_MAP, a.assetType); break;
    case 'CUT_DRUGS':
      valid = pro && typeof a.drug === 'string' && drugs.has(a.drug) && positiveInteger(a.cutPercentage) && Object.hasOwn(LAB_CUT_MULTIPLIER, a.cutPercentage as number); break;
    case 'LAB_CONFIRM': case 'LAB_CANCEL': valid = pro; break;
    case 'SELECT_LOADOUT':
      valid = pro && Array.isArray(a.weaponIndices) && a.weaponIndices.length <= 3 && a.weaponIndices.every(index) && new Set(a.weaponIndices).size === a.weaponIndices.length; break;
    case 'DISCARD_WEAPON': valid = pro && index(a.weaponIndex); break;
  }
  if (!valid) throw new Error('Invalid action values');
}

export interface RunInput { seed: string; gameMode: GameMode; actions: ProPlayerAction[] }
export function assertRun(input: unknown): asserts input is RunInput {
  if (!input || typeof input !== 'object') throw new Error('Invalid game data');
  const run = input as RunInput;
  if (typeof run.seed !== 'string' || !run.seed.trim() || run.seed.length > 128 || !GAME_MODES.includes(run.gameMode) || !Array.isArray(run.actions) || run.actions.length > MAX_ACTIONS) {
    throw new Error('Invalid game data or too many actions');
  }
  for (const action of run.actions) assertAction(action, run.gameMode !== '30');
}

export const CHOICE_EVENTS = new Set([
  'find_drugs', 'find_gun', 'find_coat', 'find_backpack', 'find_duffel',
  'find_trenchcoat', 'find_suitcase', 'find_weapon', 'cartel_offer', 'celebrity_buyer',
]);

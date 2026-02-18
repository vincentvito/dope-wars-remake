import { generateMarketPrices, type MarketResult } from './market';
import { getPriceModifier } from './cities';
import type { LocationName, DrugName } from './types';

/**
 * Generate market prices for Pro mode.
 * Wraps the classic market generator and applies city-specific price modifiers.
 * NYC districts use base prices (modifier = 1.0).
 */
export function generateProMarketPrices(
  gameSeed: string,
  day: number,
  location: LocationName
): MarketResult {
  const base = generateMarketPrices(gameSeed, day, location);

  // Apply city price modifiers
  const modifiedPrices: typeof base.prices = {};
  for (const [drug, price] of Object.entries(base.prices)) {
    const drugName = drug as DrugName;
    const modifier = getPriceModifier(location, drugName);
    modifiedPrices[drugName] = Math.floor(price * modifier);
  }

  return {
    prices: modifiedPrices,
    events: base.events,
  };
}

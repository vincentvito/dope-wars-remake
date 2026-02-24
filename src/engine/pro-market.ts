import { generateMarketPrices, type MarketResult } from './market';
import { getPriceModifier } from './cities';
import { PLANTATION_COCAINE_DISCOUNT } from './pro-constants';
import type { LocationName, DrugName } from './types';

/**
 * Generate market prices for Pro mode.
 * Wraps the classic market generator and applies city-specific price modifiers.
 * NYC districts use base prices (modifier = 1.0).
 * If hasPlantation is true and location is Medellin, cocaine gets an additional 50% discount.
 */
export function generateProMarketPrices(
  gameSeed: string,
  day: number,
  location: LocationName,
  hasPlantation?: boolean
): MarketResult {
  const base = generateMarketPrices(gameSeed, day, location);

  // Apply city price modifiers
  const modifiedPrices: typeof base.prices = {};
  for (const [drug, price] of Object.entries(base.prices)) {
    const drugName = drug as DrugName;
    let modifier = getPriceModifier(location, drugName);

    // Plantation: additional 50% discount on cocaine in Medellin
    if (hasPlantation && location === 'Medellin' && drugName === 'Cocaine') {
      modifier *= PLANTATION_COCAINE_DISCOUNT;
    }

    modifiedPrices[drugName] = Math.floor(price * modifier);
  }

  return {
    prices: modifiedPrices,
    events: base.events,
  };
}

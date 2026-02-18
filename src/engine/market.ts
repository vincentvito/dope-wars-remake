import { DRUGS, DRUG_UNAVAILABLE_CHANCE, SPIKE_MESSAGES, CRASH_MESSAGES } from './constants';
import { createDayRNG } from './rng';
import type { MarketPrices, MarketEvent } from './types';

export interface MarketResult {
  prices: MarketPrices;
  events: MarketEvent[];
}

/**
 * Generate market prices for a specific day and district.
 * Deterministic: same seed + day + district always produces the same result.
 */
export function generateMarketPrices(
  gameSeed: string,
  day: number,
  district: string
): MarketResult {
  const rng = createDayRNG(gameSeed, day, district);
  const prices: MarketPrices = {};
  const events: MarketEvent[] = [];

  for (const drug of DRUGS) {
    // 1 in N chance the drug is unavailable this turn
    if (rng.chance(DRUG_UNAVAILABLE_CHANCE)) {
      continue; // Drug not in prices = unavailable
    }

    // Base price: random within normal range
    let price = rng.nextInt(drug.minPrice, drug.maxPrice);

    // Check for price spike
    if (rng.chance(drug.spikeChance)) {
      price *= drug.spikeMultiplier;
      const messages = SPIKE_MESSAGES[drug.name];
      events.push({
        type: 'price_spike',
        drug: drug.name,
        message: messages ? rng.pick(messages) : `${drug.name} prices have spiked!`,
      });
    }
    // Check for price crash (mutually exclusive with spike)
    else if (rng.chance(drug.crashChance)) {
      price = Math.floor(price / drug.crashDivisor);
      const messages = CRASH_MESSAGES[drug.name];
      events.push({
        type: 'price_crash',
        drug: drug.name,
        message: messages ? rng.pick(messages) : `Cheap ${drug.name} is flooding the market!`,
      });
    }

    prices[drug.name] = price;
  }

  return { prices, events };
}

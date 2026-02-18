/**
 * Seeded pseudo-random number generator using the mulberry32 algorithm.
 * Produces deterministic sequences given the same seed — critical for
 * replay validation and Tier 2 multiplayer synchronization.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === 'string' ? SeededRNG.hashString(seed) : seed;
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) || 1; // Ensure non-zero
  }

  /** Returns a float in [0, 1) */
  next(): number {
    let t = (this.state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns true with a 1-in-N probability */
  chance(oneInN: number): boolean {
    return this.nextInt(1, oneInN) === 1;
  }

  /** Picks a random element from an array */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Shuffles an array in place (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * Create an RNG for a specific game day + district.
 * Same inputs always produce the same market prices.
 */
export function createDayRNG(gameSeed: string, day: number, district: string): SeededRNG {
  return new SeededRNG(`${gameSeed}-day${day}-${district}`);
}

/**
 * Create an RNG for travel events between two districts.
 * Same travel route on the same day produces the same events.
 */
export function createTravelRNG(
  gameSeed: string,
  day: number,
  fromDistrict: string,
  toDistrict: string
): SeededRNG {
  return new SeededRNG(`${gameSeed}-travel-day${day}-${fromDistrict}-${toDistrict}`);
}

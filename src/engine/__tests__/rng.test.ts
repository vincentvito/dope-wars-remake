import { describe, it, expect } from 'vitest';
import { SeededRNG, createDayRNG, createTravelRNG } from '../rng';

describe('SeededRNG', () => {
  it('produces deterministic sequences from the same seed', () => {
    const rng1 = new SeededRNG('test-seed');
    const rng2 = new SeededRNG('test-seed');

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences from different seeds', () => {
    const rng1 = new SeededRNG('seed-a');
    const rng2 = new SeededRNG('seed-b');

    const val1 = rng1.next();
    const val2 = rng2.next();

    expect(val1).not.toEqual(val2);
  });

  it('next() returns values in [0, 1)', () => {
    const rng = new SeededRNG('range-test');
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('nextInt() returns values within the specified range', () => {
    const rng = new SeededRNG('int-test');
    for (let i = 0; i < 500; i++) {
      const val = rng.nextInt(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('chance() returns boolean', () => {
    const rng = new SeededRNG('chance-test');
    let trueCount = 0;
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      if (rng.chance(10)) trueCount++;
    }

    // Expect roughly 10% (1 in 10), with tolerance
    expect(trueCount).toBeGreaterThan(iterations * 0.05);
    expect(trueCount).toBeLessThan(iterations * 0.20);
  });

  it('pick() selects from array deterministically', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const rng1 = new SeededRNG('pick-test');
    const rng2 = new SeededRNG('pick-test');

    const picks1 = Array.from({ length: 5 }, () => rng1.pick(arr));
    const picks2 = Array.from({ length: 5 }, () => rng2.pick(arr));

    expect(picks1).toEqual(picks2);
  });

  it('works with numeric seeds', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    expect(rng1.next()).toEqual(rng2.next());
  });
});

describe('createDayRNG', () => {
  it('same seed + day + district = same RNG', () => {
    const rng1 = createDayRNG('game123', 5, 'Bronx');
    const rng2 = createDayRNG('game123', 5, 'Bronx');

    expect(rng1.next()).toEqual(rng2.next());
    expect(rng1.nextInt(1, 100)).toEqual(rng2.nextInt(1, 100));
  });

  it('different day = different RNG', () => {
    const rng1 = createDayRNG('game123', 5, 'Bronx');
    const rng2 = createDayRNG('game123', 6, 'Bronx');

    expect(rng1.next()).not.toEqual(rng2.next());
  });

  it('different district = different RNG', () => {
    const rng1 = createDayRNG('game123', 5, 'Bronx');
    const rng2 = createDayRNG('game123', 5, 'Manhattan');

    expect(rng1.next()).not.toEqual(rng2.next());
  });
});

describe('createTravelRNG', () => {
  it('same route = same events', () => {
    const rng1 = createTravelRNG('game123', 5, 'Bronx', 'Manhattan');
    const rng2 = createTravelRNG('game123', 5, 'Bronx', 'Manhattan');

    expect(rng1.next()).toEqual(rng2.next());
  });

  it('different routes = different events', () => {
    const rng1 = createTravelRNG('game123', 5, 'Bronx', 'Manhattan');
    const rng2 = createTravelRNG('game123', 5, 'Bronx', 'Brooklyn');

    expect(rng1.next()).not.toEqual(rng2.next());
  });
});

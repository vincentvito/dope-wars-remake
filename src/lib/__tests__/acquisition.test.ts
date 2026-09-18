import { describe, it, expect } from 'vitest';
import { sanitizeAcquisition, classifyAcquisition } from '../acquisition';
import { projectInterest } from '../interest';
import { accrueInterest } from '@/engine/finance';
import { createNewGame } from '@/engine/game';

describe('acquisition labels', () => {
  it('discards arbitrary paths and personal metadata before checkout', () => {
    expect(sanitizeAcquisition({ channel: 'alice@example.com', landing: '/setup-account?token=private', email: 'secret' })).toEqual({ channel: 'direct', landing: '/' });
    expect(sanitizeAcquisition(null)).toEqual({ channel: 'direct', landing: '/' });
  });
  it('distinguishes real search/AI hosts from similarly named sites', () => {
    const classify = (ref: string) => classifyAcquisition(ref, '/about', 'https://www.playdopewars.com').channel;
    expect(classify('https://www.google.com/search?q=game')).toBe('organic_search');
    expect(classify('https://www.google.co.uk/')).toBe('organic_search');
    expect(classify('https://chatgpt.com/?secret=x')).toBe('ai_referral');
    expect(classify('https://chatgpt.com.evil.example/')).toBe('referral');
    expect(classify('https://google.com.evil.example/')).toBe('referral');
    expect(classify('https://www.playdopewars.com/blog')).toBe('direct');
    expect(classify('')).toBe('direct');
  });
});

describe('Classic interest projection', () => {
  it('matches actual game travel interest across every supported horizon', () => {
    for (const initial of [0, 1, 19, 101, 2000, 5000, 99999]) {
      let game = { ...createNewGame('calculator-test'), debt: initial, bank: initial };
      for (let trips = 0; trips <= 30; trips++) {
        expect(projectInterest(initial, trips, 'debt')).toBe(game.debt);
        expect(projectInterest(initial, trips, 'bank')).toBe(game.bank);
        game = accrueInterest(game);
      }
    }
  });
  it('bounds invalid input without producing NaN', () => {
    expect(projectInterest(NaN, 10, 'bank')).toBe(0);
    expect(projectInterest(-100, Infinity, 'debt')).toBe(0);
    expect(projectInterest(5000, 31, 'debt')).toBe(projectInterest(5000, 30, 'debt'));
  });
});

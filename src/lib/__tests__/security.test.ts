import { describe, it, expect } from 'vitest';
import { sanitizeRedirect } from '../redirect';
import { isPaidProCheckout } from '../checkout';

describe('auth redirects', () => {
  it.each(['//evil.test', '/.//evil.test', '/%2e//evil.test', '/\\evil.test', '/\n/evil.test', 'https://evil.test', null, {}, '/\tevil.test'])('rejects external or malformed redirect %s', value => expect(sanitizeRedirect(value)).toBe('/'));
  it('keeps valid local query strings', () => expect(sanitizeRedirect('/game?pro_success=1')).toBe('/game?pro_success=1'));
});
describe('payment entitlement', () => {
  it('requires a paid one-time checkout for the configured Pro price', () => {
    const paid = { mode: 'payment', payment_status: 'paid' } as const;
    expect(isPaidProCheckout(paid, ['price_pro'], 'price_pro')).toBe(true);
    expect(isPaidProCheckout({ ...paid, payment_status: 'unpaid' }, ['price_pro'], 'price_pro')).toBe(false);
    expect(isPaidProCheckout(paid, ['price_other'], 'price_pro')).toBe(false);
    expect(isPaidProCheckout(paid, ['price_pro'], undefined)).toBe(false);
    expect(isPaidProCheckout({ ...paid, mode: 'subscription' }, ['price_pro'], 'price_pro')).toBe(false);
  });
});

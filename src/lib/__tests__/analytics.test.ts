// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
const send = vi.hoisted(() => vi.fn());
vi.mock('@vercel/analytics', () => ({ track: send }));
beforeEach(() => {
  for (const key of ['localStorage', 'sessionStorage']) {
    const data = new Map<string, string>();
    vi.stubGlobal(key, { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => data.set(k, v), clear: () => data.clear() });
  }
  vi.resetModules(); send.mockReset();
});
describe('game milestone measurement', () => {
  it('sends each milestone once per run, including after a module reload', async () => {
    let analytics = await import('../analytics');
    analytics.configureAnalytics(true);
    analytics.trackRunEvent('first_trade', 'private-seed', { mode: '30' });
    analytics.trackRunEvent('first_trade', 'private-seed', { mode: '30' });
    vi.resetModules(); analytics = await import('../analytics'); analytics.configureAnalytics(true);
    analytics.trackRunEvent('first_trade', 'private-seed', { mode: '30' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith('first_trade_classic', { channel: 'direct', landing: '/' });
    expect(JSON.stringify(send.mock.calls)).not.toContain('private-seed');
    analytics.trackRunEvent('first_trade', 'new-private-seed', { mode: 'pro_30' });
    expect(send).toHaveBeenCalledTimes(2);
  });
  it('does not interrupt play if analytics throws or is disabled', async () => {
    const analytics = await import('../analytics');
    analytics.trackFunnel('checkout_started'); analytics.trackRunEvent('game_start', 'test', { mode: '30' });
    expect(localStorage.getItem('dope-wars-measured-run-v1')).toBeNull(); expect(send).not.toHaveBeenCalled();
    analytics.configureAnalytics(true); send.mockImplementation(() => { throw Error('offline'); });
    expect(() => analytics.trackFunnel('checkout_started')).not.toThrow();
  });
});

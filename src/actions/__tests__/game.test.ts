import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyProAction, createProGame } from '@/engine/pro-game';
import { applyAction, createNewGame } from '@/engine/game';
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), createServiceClient: vi.fn(), isSupabaseConfigured: vi.fn(() => true), rpc: vi.fn(), cookieGet: vi.fn(), cookieSet: vi.fn() }));
vi.mock('@/lib/supabase/server', () => mocks);
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.cookieGet, set: mocks.cookieSet }) }));
import { submitGameScore } from '../game';

function auth(pro = true, signedIn = true) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { is_pro: pro, username: 'tester' } }) };
  mocks.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: signedIn ? { id: 'user-id' } : null } }) }, from: vi.fn().mockReturnValue(query) });
}

beforeEach(() => { vi.clearAllMocks(); mocks.isSupabaseConfigured.mockReturnValue(true); mocks.cookieGet.mockReturnValue(undefined); auth(); mocks.rpc.mockResolvedValue({ error: null }); mocks.createServiceClient.mockResolvedValue({ rpc: mocks.rpc }); });

function classicRun() {
  let state = createNewGame('classic-score-regression');
  for (let i = 0; state.phase !== 'game_over' && i < 250; i++) {
    state = applyAction(state, state.phase === 'combat' ? { type: 'COMBAT_RUN' } : state.phase === 'event' ? { type: 'EVENT_ACCEPT' } : { type: 'TRAVEL', destination: state.currentDistrict === 'Bronx' ? 'Manhattan' : 'Bronx' });
  }
  return { seed: state.seed, gameMode: state.gameMode, actions: state.actionLog };
}
describe('score server boundary', () => {
  it('rejects malformed data before authentication or replay', async () => {
    expect(await submitGameScore({ seed: 'x', gameMode: 'pro_30', actions: [{ type: 'BANK_DEPOSIT', amount: NaN }] })).toHaveProperty('error');
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('requires authentication and Pro membership', async () => {
    auth(true, false);
    expect(await submitGameScore({ seed: 'x', gameMode: 'pro_30', actions: [] })).toHaveProperty('error');
    auth(false);
    expect(await submitGameScore({ seed: 'x', gameMode: 'pro_30', actions: [] })).toHaveProperty('error');
    expect(mocks.createServiceClient).not.toHaveBeenCalled();
  });
  it('rejects unfinished games without writing to the database', async () => {
    expect(await submitGameScore({ seed: 'x', gameMode: 'pro_30', actions: [] })).toHaveProperty('error');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('lets free accounts post Classic scores using their own profile name', async () => {
    auth(false);
    expect(await submitGameScore({ ...classicRun(), nickname: 'Impersonator' })).toHaveProperty('success', true);
    expect(mocks.rpc).toHaveBeenCalledWith('record_game_score', { payload: expect.objectContaining({ user_id: 'user-id', guest_id: null, username: 'tester', game_mode: '30' }) });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
  it('posts validated guest Classic scores without creating an account', async () => {
    auth(false, false);
    expect(await submitGameScore({ ...classicRun(), nickname: ' Street_1 ' })).toHaveProperty('success', true);
    const payload = mocks.rpc.mock.calls[0][1].payload;
    expect(payload).toMatchObject({ user_id: null, username: 'Street_1', game_mode: '30' });
    expect(payload.guest_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(mocks.cookieSet).toHaveBeenCalledWith('dope-wars-guest', payload.guest_id, expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
  });
  it('reuses a private guest identity for idempotent retries', async () => {
    auth(false, false);
    const guestId = '33333333-3333-4333-8333-333333333333';
    mocks.cookieGet.mockReturnValue({ value: guestId });
    await submitGameScore({ ...classicRun(), nickname: 'Street_1' });
    expect(mocks.rpc.mock.calls[0][1].payload.guest_id).toBe(guestId);
  });
  it.each(['', 'ab', '<script>', 'a'.repeat(21)])('rejects invalid guest nickname %j', async nickname => {
    auth(false, false);
    expect(await submitGameScore({ ...classicRun(), nickname })).toHaveProperty('error');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('rejects unfinished guest runs and does not create a cookie', async () => {
    auth(false, false);
    expect(await submitGameScore({ seed: 'x', gameMode: '30', actions: [], nickname: 'Street_1' })).toHaveProperty('error');
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
  it('surfaces guest rate limits without reporting success', async () => {
    auth(false, false);
    mocks.rpc.mockResolvedValue({ error: { message: 'guest_score_limit', code: 'P0001' } });
    expect(await submitGameScore({ ...classicRun(), nickname: 'Street_1' })).toHaveProperty('error', expect.stringContaining('10 scores'));
  });
  it('returns an actionable error when services are not configured', async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);
    expect(await submitGameScore(classicRun())).toHaveProperty('error', expect.stringContaining('temporarily unavailable'));
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('submits a completed replay using the atomic RPC and surfaces database failure', async () => {
    let state = createProGame('score-regression', 'pro_30');
    for (let i = 0; state.phase !== 'game_over' && i < 250; i++) {
      state = applyProAction(state, state.phase === 'combat' ? { type: 'COMBAT_RUN' } : state.phase === 'event' ? { type: 'EVENT_ACCEPT' } : { type: 'TRAVEL', destination: state.currentDistrict === 'Bronx' ? 'Manhattan' : 'Bronx' });
    }
    const input = { seed: state.seed, gameMode: state.gameMode, actions: state.actionLog };
    expect(await submitGameScore(input)).toHaveProperty('success', true);
    expect(mocks.rpc).toHaveBeenCalledWith('record_game_score', expect.objectContaining({ payload: expect.objectContaining({ final_cash: state.cash, user_id: 'user-id' }) }));
    mocks.rpc.mockResolvedValue({ error: { message: 'database unavailable' } });
    expect(await submitGameScore(input)).toHaveProperty('error');
  });
});

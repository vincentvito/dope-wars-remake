import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyProAction, createProGame } from '@/engine/pro-game';
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), createServiceClient: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/supabase/server', () => mocks);
import { submitGameScore } from '../game';

function auth(pro = true, signedIn = true) {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { is_pro: pro, username: 'tester' } }) };
  mocks.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: signedIn ? { id: 'user-id' } : null } }) }, from: vi.fn().mockReturnValue(query) });
}

beforeEach(() => { vi.clearAllMocks(); auth(); mocks.rpc.mockResolvedValue({ error: null }); mocks.createServiceClient.mockResolvedValue({ rpc: mocks.rpc }); });
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

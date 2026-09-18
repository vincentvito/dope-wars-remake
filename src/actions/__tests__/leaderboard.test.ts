import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), isSupabaseConfigured: vi.fn() }));
vi.mock('@/lib/supabase/server', () => mocks);
import { getLeaderboard, searchLeaderboard } from '../leaderboard';

const response = { data: [] as unknown[], count: 0, error: null as null | { message: string } };
const query = {
  select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(), ilike: vi.fn().mockReturnThis(),
  then: (resolve: (value: typeof response) => unknown) => Promise.resolve(resolve(response)),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSupabaseConfigured.mockReturnValue(true);
  mocks.createClient.mockResolvedValue({ from: () => query });
  response.data = []; response.count = 0; response.error = null;
});

describe('leaderboard availability', () => {
  it('defaults to the free Classic board and only returns validated scores', async () => {
    expect(await getLeaderboard()).toEqual({ entries: [], totalCount: 0 });
    expect(query.eq).toHaveBeenCalledWith('game_mode', '30');
    expect(query.eq).toHaveBeenCalledWith('validated', true);
  });
  it('keeps Pro results separate', async () => {
    await getLeaderboard({ gameMode: 'pro_60' });
    expect(query.eq).toHaveBeenCalledWith('game_mode', 'pro_60');
  });
  it('distinguishes missing configuration and database failures from an empty board', async () => {
    mocks.isSupabaseConfigured.mockReturnValue(false);
    expect(await getLeaderboard()).toHaveProperty('error');
    mocks.isSupabaseConfigured.mockReturnValue(true);
    response.error = { message: 'unavailable' };
    expect(await getLeaderboard()).toHaveProperty('error');
    expect(await searchLeaderboard('tester')).toHaveProperty('error');
  });
  it('treats underscores in a nickname as literal search text', async () => {
    await searchLeaderboard('street_1', '30');
    expect(query.ilike).toHaveBeenCalledWith('username', '%street\\_1%');
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createNewGame } from '@/engine/game';
import { createProGame } from '@/engine/pro-game';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { submitGameScore } from '@/actions/game';
import { GameOverScreen } from '../GameOverScreen';

vi.mock('@/actions/game', () => ({ submitGameScore: vi.fn() }));
vi.mock('../ScreenDialog', () => ({ ScreenDialog: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('../MotionImage', () => ({ MotionImage: () => null }));

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key), clear: () => storage.clear(),
  });
  vi.clearAllMocks(); localStorage.clear();
  useGameStore.setState({ isPro: false, gameState: { ...createNewGame('test-result'), phase: 'game_over' }, saveError: null });
  useAuthStore.setState({ isLoaded: true, isLoggedIn: false, isPro: false, username: null });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('posting from a completed run', () => {
  it('offers nickname-only Classic posting, retries errors, and links to the matching board', async () => {
    vi.mocked(submitGameScore).mockResolvedValueOnce({ error: 'Try later' }).mockResolvedValueOnce({ success: true, netWorth: -3000 });
    render(<GameOverScreen />);
    fireEvent.change(screen.getByLabelText('Your nickname'), { target: { value: 'Street_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'POST MY SCORE' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toBe('Try later');
    expect(screen.getByLabelText<HTMLInputElement>('Your nickname').value).toBe('Street_1');
    fireEvent.click(screen.getByRole('button', { name: 'TRY AGAIN' }));
    const link = await screen.findByRole('link', { name: 'VIEW LEADERBOARD' });
    expect(link.getAttribute('href')).toBe('/leaderboard?mode=30');
    expect(submitGameScore).toHaveBeenLastCalledWith(expect.objectContaining({ gameMode: '30', nickname: 'Street_1' }));
    expect(localStorage.getItem('dope-wars-nickname')).toBe('Street_1');
  });
  it('prevents double posts and replacing a result while saving', async () => {
    let finish!: (value: { success: boolean; netWorth: number }) => void;
    vi.mocked(submitGameScore).mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<GameOverScreen />);
    fireEvent.change(screen.getByLabelText('Your nickname'), { target: { value: 'Street_1' } });
    fireEvent.click(screen.getByRole('button', { name: 'POST MY SCORE' }));
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'PLAY AGAIN' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'SAVING SCORE...' }));
    expect(submitGameScore).toHaveBeenCalledTimes(1);
    finish({ success: true, netWorth: 0 });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'SAVING SCORE...' })).toBeNull());
  });
  it('lets free account holders post Classic without asking for another name', () => {
    useAuthStore.setState({ isLoggedIn: true, username: 'Member' });
    render(<GameOverScreen />);
    expect(screen.queryByLabelText('Your nickname')).toBeNull();
    expect(screen.getByText('Posting publicly as @Member')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'POST MY SCORE' })).toBeTruthy();
  });
  it('asks signed-out Pro players to sign in and returns them to their result', () => {
    useGameStore.setState({ isPro: true, proGameState: { ...createProGame('test-pro-result', 'pro_45'), phase: 'game_over' } });
    render(<GameOverScreen />);
    expect(screen.queryByLabelText('Your nickname')).toBeNull();
    expect(screen.getByRole('link', { name: 'SIGN IN TO POST YOUR PRO SCORE' }).getAttribute('href')).toBe('/login?redirect=%2Fgame');
  });
});

import type { GameMode } from '@/engine/types';

export const LEADERBOARD_MODES = [
  { value: '30', label: 'CLASSIC', name: 'Classic · 30 days' },
  { value: 'pro_30', label: 'PRO 30', name: 'Pro · 30 days' },
  { value: 'pro_45', label: 'PRO 45', name: 'Pro · 45 days' },
  { value: 'pro_60', label: 'PRO 60', name: 'Pro · 60 days' },
] as const;

export function isLeaderboardMode(mode: unknown): mode is GameMode {
  return LEADERBOARD_MODES.some((item) => item.value === mode);
}

export function normalizeNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const nickname = value.trim();
  return /^[a-zA-Z0-9_-]{3,20}$/.test(nickname) ? nickname : null;
}

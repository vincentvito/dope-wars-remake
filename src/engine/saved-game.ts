import { applyAction, createNewGame } from './game';
import { applyProAction, createProGame } from './pro-game';
import { assertRun, MAX_SAVE_BYTES } from './validation';
import type { GameState, PlayerAction, ProGameState } from './types';

export const SAVE_KEY = 'dope-wars-save';
// Increment when deterministic game rules change. Persist actions, never trust saved money/health.
export const SAVE_VERSION = 1;

export function serializeGame(state: GameState | ProGameState): string {
  const run = { seed: state.seed, gameMode: state.gameMode, actions: state.actionLog };
  assertRun(run);
  const serialized = JSON.stringify({ version: SAVE_VERSION, ...run });
  if (serialized.length > MAX_SAVE_BYTES) throw new Error('Save is too large');
  return serialized;
}

export function restoreGame(serialized: string): GameState | ProGameState {
  if (serialized.length > MAX_SAVE_BYTES) throw new Error('Save is too large');
  const saved = JSON.parse(serialized);
  if (saved?.version !== SAVE_VERSION) throw new Error('Unsupported save version');
  assertRun(saved);
  if (saved.gameMode === '30') {
    let state = createNewGame(saved.seed, saved.gameMode);
    for (const action of saved.actions) state = applyAction(state, action as PlayerAction, false);
    return { ...state, actionLog: saved.actions as PlayerAction[] };
  }
  let state = createProGame(saved.seed, saved.gameMode);
  for (const action of saved.actions) state = applyProAction(state, action, false);
  return { ...state, actionLog: saved.actions };
}

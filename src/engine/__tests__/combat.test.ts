import { describe, it, expect } from 'vitest';
import { initCombat, resolveFight, resolveRun } from '../combat';
import { createNewGame } from '../game';

describe('resolveFight — weapon consumption', () => {
  it('sets guns to 0 when officer is defeated', () => {
    let state = createNewGame('combat-consume-seed');
    state = { ...state, guns: 3, health: 100 };
    const combat = initCombat(state);
    state = {
      ...state,
      combat: { ...combat, officerHealth: 1 },
      phase: 'combat',
    };

    const result = resolveFight(state);
    expect(result.phase).toBe('market');
    expect(result.guns).toBe(0);
  });

  it('does NOT consume guns during mid-combat rounds', () => {
    let state = createNewGame('combat-midround-seed');
    state = { ...state, guns: 3, health: 100 };
    const combat = initCombat(state);
    state = {
      ...state,
      combat: { ...combat, officerHealth: 200 },
      phase: 'combat',
    };

    const result = resolveFight(state);
    if (result.combat) {
      // Combat continues — guns should still be present
      expect(result.guns).toBe(3);
    }
  });
});

describe('resolveRun — weapon preservation', () => {
  it('preserves guns on successful escape', () => {
    let state = createNewGame('run-preserve-seed');
    state = { ...state, guns: 4, health: 100 };
    const combat = initCombat(state);
    // High rounds elapsed to guarantee escape
    state = {
      ...state,
      combat: { ...combat, roundsElapsed: 10 },
      phase: 'combat',
    };

    let found = false;
    for (let i = 0; i < 30; i++) {
      const testState = { ...state, seed: `run-preserve-${i}` };
      const result = resolveRun(testState);
      if (result.phase === 'market') {
        expect(result.guns).toBe(4); // Guns preserved on run
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

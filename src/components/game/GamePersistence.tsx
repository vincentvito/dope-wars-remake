'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';

declare global {
  interface Window { render_game_to_text?: () => string; }
}

export function GamePersistence() {
  useEffect(() => {
    useGameStore.getState().hydrate();
    // Read-only automation hook. This turn-based game advances only on player actions.
    window.render_game_to_text = () => {
      const store = useGameStore.getState();
      const state = store.isPro ? store.proGameState : store.gameState;
      return JSON.stringify({ ...state, actionLog: undefined, coordinates: 'Menu-driven game; no spatial coordinates',
        modal: useUIStore.getState().activeModal, saved: !store.saveError });
    };
    return () => { delete window.render_game_to_text; };
  }, []);
  return null;
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';

const SHAKE_DURATION_MS = 400;

interface BufferedDisplay {
  lastMessage: string;
  playerHealth: number;
  officerHealth: number;
  officerMaxHealth: number;
  guns: number;
}

export function useCombatAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const bufferedRef = useRef<BufferedDisplay | null>(null);
  const [buffered, setBuffered] = useState<BufferedDisplay | null>(null);

  const fight = useGameStore((s) => s.fight);
  const run = useGameStore((s) => s.run);

  const snapshotState = useCallback(() => {
    const s = useGameStore.getState().gameState;
    if (!s?.combat) return;
    const snap: BufferedDisplay = {
      lastMessage: s.combat.lastMessage,
      playerHealth: s.health,
      officerHealth: s.combat.officerHealth,
      officerMaxHealth: s.combat.officerMaxHealth,
      guns: s.guns,
    };
    bufferedRef.current = snap;
    setBuffered(snap);
  }, []);

  const endShake = useCallback(() => {
    bufferedRef.current = null;
    setBuffered(null);
    setIsShaking(false);
    setIsAnimating(false);
  }, []);

  const handleFight = useCallback(() => {
    if (isAnimating) return;
    snapshotState();
    fight();
    setIsAnimating(true);
    setIsShaking(true);
    setTimeout(endShake, SHAKE_DURATION_MS);
  }, [isAnimating, snapshotState, fight, endShake]);

  const handleRun = useCallback(() => {
    if (isAnimating) return;
    snapshotState();
    run();
    setIsAnimating(true);
    setIsShaking(true);
    setTimeout(endShake, SHAKE_DURATION_MS);
  }, [isAnimating, snapshotState, run, endShake]);

  return {
    isAnimating,
    isShaking,
    buffered,
    handleFight,
    handleRun,
  };
}

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const animationLock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const bufferedRef = useRef<BufferedDisplay | null>(null);
  const [buffered, setBuffered] = useState<BufferedDisplay | null>(null);

  const fight = useGameStore((s) => s.fight);
  const run = useGameStore((s) => s.run);

  const snapshotState = useCallback(() => {
    const store = useGameStore.getState();
    const s = store.isPro ? store.proGameState : store.gameState;
    const combat = store.isPro ? store.proGameState?.proCombat : store.gameState?.combat;
    if (!s || !combat) return;
    const snap: BufferedDisplay = {
      lastMessage: combat.lastMessage,
      playerHealth: s.health,
      officerHealth: combat.officerHealth,
      officerMaxHealth: combat.officerMaxHealth,
      guns: s.guns,
    };
    bufferedRef.current = snap;
    setBuffered(snap);
  }, []);

  const endShake = useCallback(() => {
    animationLock.current = false;
    bufferedRef.current = null;
    setBuffered(null);
    setIsShaking(false);
    setIsAnimating(false);
  }, []);

  const handleFight = useCallback(() => {
    if (animationLock.current) return;
    animationLock.current = true;
    snapshotState();
    fight();
    setIsAnimating(true);
    setIsShaking(true);
    timer.current = setTimeout(endShake, SHAKE_DURATION_MS);
  }, [snapshotState, fight, endShake]);

  const handleRun = useCallback(() => {
    if (animationLock.current) return;
    animationLock.current = true;
    snapshotState();
    run();
    setIsAnimating(true);
    setIsShaking(true);
    timer.current = setTimeout(endShake, SHAKE_DURATION_MS);
  }, [snapshotState, run, endShake]);

  return {
    isAnimating,
    isShaking,
    buffered,
    handleFight,
    handleRun,
  };
}

'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { GameShell } from '@/components/game/GameShell';

export default function GamePage() {
  const gameState = useGameStore((s) => s.gameState);
  const proGameState = useGameStore((s) => s.proGameState);
  const isPro = useGameStore((s) => s.isPro);
  const startNewGame = useGameStore((s) => s.startNewGame);

  // Auto-start only if no game exists at all (direct URL visit)
  useEffect(() => {
    if (!gameState && !proGameState) {
      startNewGame();
    }
  }, [gameState, proGameState, startNewGame]);

  const hasGame = isPro ? !!proGameState : !!gameState;
  if (!hasGame) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="font-pixel text-sm text-crt-green text-glow-green animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-8 relative">
      {/* NYC street background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/sprites/game/bronx-alley-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-bottom opacity-45"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        {/* Theme-tinted gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/50 via-[var(--background)]/40 to-[var(--background)]/60" />
      </div>
      <GameShell />
    </main>
  );
}

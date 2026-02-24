'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { GameShell } from '@/components/game/GameShell';

function getBackgroundForLocation(location?: string): string {
  switch (location) {
    case 'Miami':
      return '/sprites/game/miami-bg.png';
    case 'Los Angeles':
      return '/sprites/game/la-bg.png';
    case 'Medellin':
      return '/sprites/game/medellin-bg.png';
    default:
      return '/sprites/game/bronx-alley-bg.png';
  }
}

export default function GamePage() {
  useAuthHydration();
  const gameState = useGameStore((s) => s.gameState);
  const proGameState = useGameStore((s) => s.proGameState);
  const isPro = useGameStore((s) => s.isPro);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const currentDistrict = useGameStore((s) =>
    s.isPro ? s.proGameState?.currentDistrict : s.gameState?.currentDistrict
  );

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

  const bgSrc = getBackgroundForLocation(currentDistrict);

  return (
    <main className="min-h-screen pb-8 relative">
      {/* Location-specific background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          key={bgSrc}
          src={bgSrc}
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

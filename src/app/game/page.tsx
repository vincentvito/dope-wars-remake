'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { GameShell } from '@/components/game/GameShell';
import { ModeSelectOverlay } from '@/components/game/ModeSelectOverlay';
import { IntroStory } from '@/components/game/IntroStory';
import type { GameMode } from '@/engine/types';

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

type GameOverlay = null | 'mode-select' | 'intro-story';

function GamePageContent() {
  useAuthHydration();
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameState = useGameStore((s) => s.gameState);
  const proGameState = useGameStore((s) => s.proGameState);
  const isPro = useGameStore((s) => s.isPro);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const currentDistrict = useGameStore((s) =>
    s.isPro ? s.proGameState?.currentDistrict : s.gameState?.currentDistrict
  );

  const showModeSelect = useUIStore((s) => s.showModeSelect);
  const setShowModeSelect = useUIStore((s) => s.setShowModeSelect);

  const [overlay, setOverlay] = useState<GameOverlay>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const proSuccess = searchParams.get('pro_success') === '1';
  const initDone = useRef(false);

  // On mount: decide whether to show mode select or auto-start classic
  useEffect(() => {
    if (initDone.current) return;
    if (!gameState && !proGameState) {
      if (proSuccess) {
        setOverlay('mode-select');
        initDone.current = true;
      } else {
        startNewGame();
        initDone.current = true;
      }
    }
  }, [gameState, proGameState, startNewGame, proSuccess]);

  // React to "New Game" from settings menu
  useEffect(() => {
    if (showModeSelect) {
      setOverlay('mode-select');
    }
  }, [showModeSelect]);

  // Clean pro_success from URL after reading it
  useEffect(() => {
    if (proSuccess) {
      router.replace('/game', { scroll: false });
    }
  }, [proSuccess, router]);

  // Mode select overlay (shown after Pro purchase or from settings "New Game")
  if (overlay === 'mode-select') {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
        <img
          src="/sprites/landing/landing-bg.gif"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-bottom opacity-35 pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
          loading="lazy"
          decoding="async"
        />
        <ModeSelectOverlay
          onClose={() => {
            setOverlay(null);
            setShowModeSelect(false);
            // If no game exists after closing, start classic
            if (!useGameStore.getState().gameState && !useGameStore.getState().proGameState) {
              startNewGame();
            }
          }}
          onModeSelected={(mode) => {
            setSelectedMode(mode);
            setOverlay('intro-story');
          }}
        />
      </main>
    );
  }

  // Intro story overlay
  if (overlay === 'intro-story' && selectedMode) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
        <IntroStory
          onComplete={() => {
            startNewGame(selectedMode);
            setOverlay(null);
            setShowModeSelect(false);
          }}
          onBack={() => setOverlay('mode-select')}
        />
      </main>
    );
  }

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
          decoding="async"
        />
        {/* Theme-tinted gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/50 via-[var(--background)]/40 to-[var(--background)]/60" />
      </div>
      <GameShell />
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="font-pixel text-sm text-crt-green text-glow-green animate-pulse">
            Loading...
          </div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}

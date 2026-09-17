'use client';

import { MotionImage } from '@/components/game/MotionImage';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { GameShell } from '@/components/game/GameShell';
import { ModeSelectOverlay } from '@/components/game/ModeSelectOverlay';
import { IntroStory } from '@/components/game/IntroStory';
import type { GameMode } from '@/engine/types';

function getBackgroundForLocation(location?: string): string {
  switch (location) {
    case 'Miami':
      return '/sprites/game/miami-bg.webp';
    case 'Los Angeles':
      return '/sprites/game/la-bg.webp';
    case 'Medellin':
      return '/sprites/game/medellin-bg.webp';
    default:
      return '/sprites/game/bronx-alley-bg.webp';
  }
}

type GameOverlay = null | 'mode-select' | 'intro-story';

function GamePageContent() {
  useAuthHydration();
  const searchParams = useSearchParams();
  const router = useRouter();

  const saveError = useGameStore(s => s.saveError);
  const hydrated = useGameStore((s) => s.hydrated);
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
    if (initDone.current || !hydrated || saveError) return;
    if (proSuccess) setShowModeSelect(true);
    else if (!gameState && !proGameState) startNewGame();
    initDone.current = true;
  }, [gameState, proGameState, startNewGame, proSuccess, hydrated, saveError, setShowModeSelect]);

  // Clean pro_success from URL after reading it
  useEffect(() => {
    if (proSuccess) {
      useAuthStore.getState().clear();
      router.replace('/game', { scroll: false });
    }
  }, [proSuccess, router]);

  // Mode select overlay (shown after Pro purchase or from settings "New Game")
  if (overlay === 'mode-select' || (showModeSelect && overlay !== 'intro-story')) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-start overflow-y-auto py-8">
        <MotionImage
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
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-start overflow-y-auto py-8">
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
  if (!hasGame && hydrated && saveError) {
    return <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <p role="alert" className="text-crt-amber">{saveError}</p>
      <button className="retro-btn" onClick={() => startNewGame()}>START NEW GAME</button>
    </main>;
  }
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
    <main className="min-h-screen relative">
      {/* Location-specific background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <MotionImage
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

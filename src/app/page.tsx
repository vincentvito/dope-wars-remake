'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUIStore } from '@/stores/ui-store';
import { useGameStore } from '@/stores/game-store';
import { ModeSelectOverlay } from '@/components/game/ModeSelectOverlay';
import { IntroStory } from '@/components/game/IntroStory';
import type { GameMode } from '@/engine/types';

const THEME_ORDER = ['crt', 'synthwave', 'miami'] as const;
const THEME_LABELS: Record<string, string> = {
  crt: 'CRT',
  synthwave: 'Synthwave',
  miami: 'Miami',
};

type Overlay = null | 'how-to-play' | 'options' | 'mode-select' | 'intro-story';

export default function HomePage() {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const router = useRouter();

  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-start pt-[6vh] overflow-hidden">
      {/* GIF Background */}
      <img
        src="/sprites/landing/landing-bg.gif"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-bottom opacity-35 pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
        draggable={false}
      />

      {/* Main Menu Content */}
      {overlay === null && (
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-8">
          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="font-pixel text-4xl md:text-5xl text-crt-cyan text-glow-blue tracking-wider">
              DOPE WARS
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Buy low, sell high, and survive 30 days on the streets of New York.
              Pay off your debt to the loan shark and build your empire.
            </p>
          </div>

          {/* Menu Buttons */}
          <div className="w-full space-y-3">
            <button
              className="retro-btn block w-full py-4 text-sm font-bold text-center font-pixel"
              onClick={() => setOverlay('mode-select')}
            >
              NEW GAME
            </button>
            <button
              className="retro-btn block w-full py-3 text-xs text-center font-pixel"
              onClick={() => setOverlay('how-to-play')}
            >
              HOW TO PLAY
            </button>
            <button
              className="retro-btn block w-full py-3 text-xs text-center font-pixel"
              onClick={() => setOverlay('options')}
            >
              OPTIONS
            </button>
            <Link
              href="/leaderboard"
              className="retro-btn retro-btn-amber block w-full py-3 text-xs text-center font-pixel"
            >
              LEADERBOARD
            </Link>
          </div>

        </div>
      )}

      {/* Footer — always pinned to bottom */}
      <p className="absolute bottom-4 z-10 text-[10px] text-muted-foreground/50">
        A modern remake of the classic 1984 game by John E. Dell
      </p>

      {/* How to Play Overlay */}
      {overlay === 'how-to-play' && (
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-6">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            HOW TO PLAY
          </h2>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              You are a drug dealer on the streets of New York. Your goal is to
              make as much money as possible in <span className="text-crt-cyan">30 days</span>.
            </p>
            <div className="space-y-1.5">
              <p>&#8226; You start with <span className="text-crt-green">$2,000</span> cash and <span className="text-crt-red">$5,000</span> debt</p>
              <p>&#8226; Travel between 6 districts — each trip advances one day</p>
              <p>&#8226; Drug prices fluctuate daily — buy low, sell high</p>
              <p>&#8226; Your debt grows <span className="text-crt-red">10%</span> per day — pay it off fast</p>
              <p>&#8226; Watch out for cops, muggers, and other hazards</p>
              <p>&#8226; Deposit cash at the bank to earn <span className="text-crt-green">5%</span> daily interest</p>
              <p>&#8226; Find guns to fight cops, or run and risk getting caught</p>
              <p>&#8226; After 30 days, your <span className="text-crt-cyan">net worth</span> is your final score</p>
            </div>
          </div>

          <button
            className="retro-btn w-full py-3 text-xs font-pixel"
            onClick={() => setOverlay(null)}
          >
            BACK
          </button>
        </div>
      )}

      {/* Mode Select Overlay */}
      {overlay === 'mode-select' && (
        <ModeSelectOverlay
          onClose={() => setOverlay(null)}
          onModeSelected={(mode) => {
            setSelectedMode(mode);
            setOverlay('intro-story');
          }}
        />
      )}

      {/* Intro Story */}
      {overlay === 'intro-story' && selectedMode && (
        <IntroStory
          onComplete={() => {
            startNewGame(selectedMode);
            router.push('/game');
          }}
          onBack={() => setOverlay('mode-select')}
        />
      )}

      {/* Options Overlay */}
      {overlay === 'options' && (
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-6">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            OPTIONS
          </h2>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Theme</p>
              <div className="flex gap-2">
                {THEME_ORDER.map((t) => (
                  <button
                    key={t}
                    className={`retro-btn flex-1 py-2 text-[10px] font-pixel ${
                      theme === t
                        ? 'bg-crt-cyan text-black'
                        : ''
                    }`}
                    onClick={() => setTheme(t)}
                  >
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            className="retro-btn w-full py-3 text-xs font-pixel"
            onClick={() => setOverlay(null)}
          >
            BACK
          </button>
        </div>
      )}
    </main>
  );
}

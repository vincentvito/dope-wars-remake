'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/stores/game-store';
import { formatCurrency } from '@/lib/utils';
import { calculateNetWorth } from '@/engine/game';
import { calculateProNetWorth } from '@/engine/pro-game';
import { submitGameScore } from '@/actions/game';

function getGameOverGif(netWorth: number): string {
  if (netWorth < 0) return '/sprites/gameover/gameover-negative.gif';
  if (netWorth < 100_000) return '/sprites/gameover/gameover-low.gif';
  return '/sprites/gameover/gameover-high.gif';
}

const PRO_BENEFITS = [
  'Choose your campaign: 30, 45, or 60 days',
  'Buy a Lab — cut drugs for 2× profit',
  'Build a Warehouse for bulk storage',
  'Unlock Plane routes to Miami, LA & Medellín',
  'Buy a Plantation in Colombia',
  'Collect weapons & survive DEA raids',
  'Build your narcos empire!',
];

export function GameOverScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const proGameState = useGameStore((s) => s.proGameState);
  const isPro = useGameStore((s) => s.isPro);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'needsAuth'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showProBenefits, setShowProBenefits] = useState(false);

  const state = isPro ? proGameState : gameState;
  if (!state || state.phase !== 'game_over') return null;

  const netWorth = isPro && proGameState
    ? calculateProNetWorth(proGameState)
    : gameState ? calculateNetWorth(gameState) : 0;
  const isDead = state.health <= 0;
  const isPositive = netWorth >= 0;
  const maxDays = state.maxDays - 1;

  const handleSubmitScore = async () => {
    setSubmitStatus('submitting');
    setSubmitError(null);

    try {
      const result = await submitGameScore({
        seed: state.seed,
        gameMode: state.gameMode,
        actions: state.actionLog as any,
      });

      if ('error' in result && result.error) {
        if (result.error.includes('Authentication')) {
          setSubmitStatus('needsAuth');
        } else {
          setSubmitStatus('error');
          setSubmitError(result.error);
        }
      } else {
        setSubmitStatus('success');
      }
    } catch {
      setSubmitStatus('error');
      setSubmitError('Failed to submit score');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden">
      {/* Full-screen GIF background */}
      <img
        src={getGameOverGif(netWorth)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35 pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
        draggable={false}
      />

      {/* Vignette overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Content overlay */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-6 py-10">
        {/* Title */}
        <div className="text-center space-y-3">
          <h2 className={`font-pixel text-2xl ${isDead || !isPositive ? 'text-crt-red text-glow-red' : 'text-crt-green text-glow-green'}`}>
            GAME OVER
          </h2>
          <p className="text-sm text-muted-foreground">
            You survived {state.currentDay - 1} / {maxDays} days
          </p>
        </div>

        {/* Net Worth — prominent display */}
        <div className="text-center space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Net Worth
          </div>
          <div className={`font-pixel text-xl ${isPositive ? 'text-crt-green text-glow-green' : 'text-crt-red text-glow-red'}`}>
            {formatCurrency(netWorth)}
          </div>
        </div>

        {/* Submit to Leaderboard */}
        <div className="w-full space-y-2">
          {submitStatus === 'idle' && (
            <button
              className="retro-btn retro-btn-amber w-full py-2.5 text-xs font-bold font-pixel"
              onClick={handleSubmitScore}
            >
              SUBMIT TO LEADERBOARD
            </button>
          )}

          {submitStatus === 'submitting' && (
            <div className="text-center text-xs text-crt-amber animate-pulse py-2.5">
              Validating score...
            </div>
          )}

          {submitStatus === 'success' && (
            <div className="text-center space-y-2">
              <div className="text-xs text-crt-green text-glow-green py-2">
                Score submitted! Check the leaderboard.
              </div>
              <Link
                href="/leaderboard"
                className="retro-btn retro-btn-amber block w-full py-2 text-xs text-center font-pixel"
              >
                VIEW LEADERBOARD
              </Link>
            </div>
          )}

          {submitStatus === 'needsAuth' && (
            <div className="space-y-2">
              <div className="text-xs text-crt-amber text-center py-1">
                Sign in to submit your score
              </div>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="retro-btn flex-1 py-2 text-xs text-center font-pixel"
                >
                  LOG IN
                </Link>
                <Link
                  href="/register"
                  className="retro-btn retro-btn-amber flex-1 py-2 text-xs text-center font-pixel"
                >
                  REGISTER
                </Link>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="text-center text-xs text-crt-red py-2">
              {submitError || 'Failed to submit score'}
            </div>
          )}
        </div>

        {/* Play Again */}
        <button
          className="retro-btn w-full py-3 text-xs font-bold font-pixel"
          onClick={() => startNewGame()}
        >
          PLAY AGAIN
        </button>

        {/* Go Pro */}
        <div className="w-full space-y-2">
          <button
            className="retro-btn retro-btn-amber w-full py-3 text-xs font-bold font-pixel"
            onClick={() => setShowProBenefits(!showProBenefits)}
          >
            GO PRO
          </button>
          {showProBenefits && (
            <div className="border border-crt-amber/30 bg-black/60 p-4 space-y-3">
              <p className="text-[10px] text-crt-amber uppercase tracking-wider text-center font-pixel">
                Dope Wars: PRO
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {PRO_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="text-crt-amber shrink-0">&#8226;</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency } from '@/lib/utils';
import { calculateNetWorth } from '@/engine/game';
import { calculateProNetWorth } from '@/engine/pro-game';
import { submitGameScore } from '@/actions/game';

function getGameOverGif(netWorth: number): string {
  if (netWorth < 0) return '/sprites/gameover/gameover-negative.gif';
  if (netWorth < 100_000) return '/sprites/gameover/gameover-low.gif';
  return '/sprites/gameover/gameover-high.gif';
}

export function GameOverScreen() {
  const gameState = useGameStore((s) => s.gameState);
  const proGameState = useGameStore((s) => s.proGameState);
  const isProGame = useGameStore((s) => s.isPro);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const isProUser = useAuthStore((s) => s.isPro);
  const isAuthLoaded = useAuthStore((s) => s.isLoaded);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const state = isProGame ? proGameState : gameState;
  if (!state || state.phase !== 'game_over') return null;

  const netWorth = isProGame && proGameState
    ? calculateProNetWorth(proGameState)
    : gameState ? calculateNetWorth(gameState) : 0;
  const isDead = state.health <= 0;
  const isPositive = netWorth >= 0;
  const maxDays = state.maxDays - 1;

  // Leaderboard only for Pro game modes played by Pro users
  const canSubmit = isAuthLoaded && isProGame && isProUser;

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
        setSubmitStatus('error');
        setSubmitError(result.error);
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

        {/* Submit to Leaderboard (Pro users playing Pro mode only) */}
        {canSubmit && (
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

            {submitStatus === 'error' && (
              <div className="text-center space-y-2">
                <div className="text-xs text-crt-red py-2">
                  {submitError || 'Failed to submit score'}
                </div>
                <button
                  className="retro-btn retro-btn-amber w-full py-2 text-xs font-pixel"
                  onClick={() => setSubmitStatus('idle')}
                >
                  RETRY
                </button>
              </div>
            )}
          </div>
        )}

        {/* Play Again */}
        <button
          className="retro-btn w-full py-3 text-xs font-bold font-pixel"
          onClick={() => startNewGame(state.gameMode)}
        >
          PLAY AGAIN
        </button>

        {/* Go Pro CTA (non-pro users only) */}
        {isAuthLoaded && !isProUser && (
          <Link
            href="/upgrade"
            className="retro-btn retro-btn-amber w-full py-3 text-xs font-bold font-pixel text-center block"
          >
            GO PRO — $7.99
          </Link>
        )}
      </div>
    </div>
  );
}

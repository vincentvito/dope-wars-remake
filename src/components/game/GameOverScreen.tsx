'use client';

import { trackRunEvent } from '@/lib/analytics';
import { MotionImage } from '@/components/game/MotionImage';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ScreenDialog } from './ScreenDialog';
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
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const username = useAuthStore((s) => s.username);
  const isAuthLoaded = useAuthStore((s) => s.isLoaded);
  const saveError = useGameStore((s) => s.saveError);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nickname, setNickname] = useState(() => {
    try { return typeof window !== 'undefined' ? localStorage.getItem('dope-wars-nickname') ?? '' : ''; }
    catch { return ''; }
  });
  const submitting = useRef(false);

  const state = isProGame ? proGameState : gameState;
  if (!state || state.phase !== 'game_over') return null;

  const netWorth = isProGame && proGameState
    ? calculateProNetWorth(proGameState)
    : gameState ? calculateNetWorth(gameState) : 0;
  const isDead = state.health <= 0;
  const isPositive = netWorth >= 0;
  const maxDays = state.maxDays - 1;

  const canSubmit = isAuthLoaded && (!isProGame || (isLoggedIn && isProUser));

  const handleSubmitScore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setSubmitStatus('submitting');
    setSubmitError(null);

    try {
      const result = await submitGameScore({
        seed: state.seed,
        gameMode: state.gameMode,
        actions: state.actionLog,
        ...(!isLoggedIn ? { nickname: nickname.trim() } : {}),
      });

      if ('error' in result && result.error) {
        setSubmitStatus('error');
        setSubmitError(result.error);
      } else {
        setSubmitStatus('success');
        trackRunEvent('score_submitted', state.seed, { mode: state.gameMode });
        if (!isLoggedIn) {
          try { localStorage.setItem('dope-wars-nickname', nickname.trim()); } catch { /* Posting works without local storage. */ }
        }
      }
    } catch {
      setSubmitStatus('error');
      setSubmitError('Could not save your score. Keep this result open and try again.');
    } finally {
      submitting.current = false;
    }
  };

  return (
    <ScreenDialog title="Game over" className="justify-start py-8">
      {/* Full-screen GIF background */}
      <MotionImage
        src={getGameOverGif(netWorth)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35 pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
        draggable={false}
      />

      {/* Vignette overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Content overlay */}
      <div className="relative z-10 my-auto shrink-0 w-full max-w-sm flex flex-col items-center px-6 gap-6 py-10">
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

        {/* Make posting a score the main end-of-run action, including for guests. */}
        {canSubmit && (
          <div className="w-full space-y-2">
            {submitStatus !== 'success' && (
              <form onSubmit={handleSubmitScore} className="space-y-3">
                <p className="text-center text-sm text-crt-amber">Leave your mark on the leaderboard.</p>
                {!isLoggedIn ? (
                  <div className="space-y-2">
                    <label htmlFor="score-nickname" className="block text-xs text-muted-foreground">Your nickname</label>
                    <input id="score-nickname" name="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)}
                      required minLength={3} maxLength={20} pattern={'[a-zA-Z0-9_\\-]{3,20}'} autoComplete="nickname" autoCapitalize="none" spellCheck={false}
                      disabled={submitStatus === 'submitting'} aria-describedby="score-nickname-help"
                      className="w-full min-h-11 bg-black/70 border border-[#555] px-3 py-2 text-base" placeholder="Pick a street name" />
                    <p id="score-nickname-help" className="text-xs text-muted-foreground">3–20 letters, numbers, hyphens or underscores. No account needed. Your nickname and score will be public.</p>
                  </div>
                ) : <p className="text-xs text-center text-muted-foreground">Posting publicly as @{username}</p>}
                {submitError && <p role="alert" className="text-xs text-crt-red">{submitError}</p>}
                <button type="submit" disabled={submitStatus === 'submitting'}
                  className="retro-btn retro-btn-amber w-full min-h-11 py-3 text-xs font-bold font-pixel">
                  {submitStatus === 'submitting' ? 'SAVING SCORE...' : submitStatus === 'error' ? 'TRY AGAIN' : 'POST MY SCORE'}
                </button>
                <p role="status" className="text-xs text-muted-foreground text-center">
                  {submitStatus === 'submitting' ? 'Checking your run and saving your score…' : isProGame ? 'Compete on the Pro leaderboard.' : 'Free Classic leaderboard · every completed run counts.'}
                </p>
              </form>
            )}

            {submitStatus === 'success' && (
              <div className="text-center space-y-2">
                <div role="status" className="text-xs text-crt-green text-glow-green py-2">
                  Your score is on the leaderboard!
                </div>
                <Link
                  href={`/leaderboard?mode=${state.gameMode}`}
                  className="retro-btn retro-btn-amber block w-full py-2 text-xs text-center font-pixel"
                >
                  VIEW LEADERBOARD
                </Link>
              </div>
            )}

          </div>
        )}

        {isAuthLoaded && isProGame && !isLoggedIn && (
          <Link href="/login?redirect=%2Fgame" className="retro-btn retro-btn-amber w-full py-3 text-xs text-center">
            SIGN IN TO POST YOUR PRO SCORE
          </Link>
        )}
        {saveError && <p role="alert" className="text-xs text-crt-amber">{saveError} Post your score before leaving this page.</p>}

        {/* Play Again */}
        <button
          className="retro-btn w-full py-3 text-xs font-bold font-pixel"
          disabled={submitStatus === 'submitting'}
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
    </ScreenDialog>
  );
}

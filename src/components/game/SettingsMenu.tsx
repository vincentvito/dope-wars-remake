'use client';

import { useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useUIStore } from '@/stores/ui-store';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { signOut } from '@/actions/auth';

const THEME_ORDER = ['crt', 'synthwave', 'miami'] as const;
const THEME_LABELS = { crt: 'CRT', synthwave: 'Synthwave', miami: 'Miami' } as const;

export function SettingsMenu() {
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isPro = useAuthStore((s) => s.isPro);
  const username = useAuthStore((s) => s.username);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const clearAuth = useAuthStore((s) => s.clear);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSettingsOpen(false); ref.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', onKey); };
  }, [settingsOpen, setSettingsOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="text-muted-foreground hover:text-crt-green transition-colors p-1"
        aria-label="Settings"
        aria-expanded={settingsOpen}
        aria-controls="game-settings"
      >
        <Settings size={16} />
      </button>

      {settingsOpen && (
        <div id="game-settings" className="absolute right-0 top-full mt-1 z-50 bg-[var(--surface)] border border-[var(--border-strong)] min-w-[180px] py-1">
          {/* User identity */}
          {isLoaded && (
            isLoggedIn ? (
              <>
                <div className="px-3 py-2 text-xs text-foreground border-b border-border">
                  {isPro && (
                    <span className="text-crt-amber font-pixel text-[10px] mr-1">PRO</span>
                  )}
                  <span className="text-crt-green">@{username}</span>
                </div>
                <button
                  className="block w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-crt-red transition-colors"
                  onClick={async () => {
                    setSettingsOpen(false);
                    clearAuth();
                    await signOut();
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-crt-green transition-colors"
                  onClick={() => setSettingsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-crt-green transition-colors"
                  onClick={() => setSettingsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )
          )}

          <div className="border-t border-border my-1" />

          {/* Theme toggle */}
          <button
            className="block w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-crt-amber transition-colors"
            onClick={() => {
              const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
              setTheme(nextTheme);
              setSettingsOpen(false);
            }}
          >
            Theme: {THEME_LABELS[theme]}
          </button>

          {/* New Game */}
          <button
            className="block w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-crt-cyan transition-colors"
            onClick={() => {
              setSettingsOpen(false);
              const store = useGameStore.getState();
              if (!store.isPlaying || window.confirm('Start a new game? This replaces your saved run.')) useUIStore.getState().setShowModeSelect(true);
            }}
          >
            New Game
          </button>

          {/* Pro status */}
          {isLoaded && !isPro && (
            <Link
              href="/upgrade"
              className="block w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-crt-cyan transition-colors"
              onClick={() => setSettingsOpen(false)}
            >
              Go Pro — $7.99
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

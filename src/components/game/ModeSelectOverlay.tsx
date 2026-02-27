'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import type { GameMode } from '@/engine/types';

interface ModeSelectOverlayProps {
  onClose: () => void;
  onModeSelected: (mode: GameMode) => void;
}

const PRO_BENEFITS_SHORT = [
  'Labs, Warehouses, Planes & more',
  'Miami, LA & Medellin routes',
  'Weapons & DEA raids',
  'Pro Leaderboards',
];

export function ModeSelectOverlay({ onClose, onModeSelected }: ModeSelectOverlayProps) {
  const isPro = useAuthStore((s) => s.isPro);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const proLocked = isLoaded && !isPro;

  const handleProClick = (mode: GameMode) => {
    if (!isLoaded) return;
    if (isPro) {
      onModeSelected(mode);
    } else {
      setShowUpgrade(true);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-6">
      <h2 className="font-pixel text-sm text-crt-cyan text-glow-blue">
        SELECT MODE
      </h2>

      {/* Classic Mode */}
      <div className="w-full retro-card p-4 space-y-3">
        <div className="text-center">
          <span className="font-pixel text-xs text-crt-cyan">CLASSIC</span>
          <span className="text-[10px] text-crt-green ml-2">FREE</span>
          <p className="text-[10px] text-muted-foreground mt-1">
            The original drug trading experience. Buy low, sell high in NYC.
          </p>
        </div>
        <button
          className="retro-btn w-full py-2 text-[10px] font-pixel"
          onClick={() => onModeSelected('30')}
        >
          30 DAYS
        </button>
      </div>

      {/* Pro Mode */}
      <div className="w-full retro-card p-4 space-y-3 border-crt-amber/30">
        <div className="text-center">
          <span className="font-pixel text-xs text-crt-amber text-glow-amber">PRO</span>
          {proLocked && (
            <span className="text-[10px] text-crt-amber ml-2">$7.99</span>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            Build an empire. Buy assets, travel cities, arm up.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['pro_30', 'pro_45', 'pro_60'] as const).map((d) => (
            <button
              key={d}
              className={`retro-btn retro-btn-amber py-2 text-[10px] font-pixel relative ${
                proLocked ? 'opacity-70' : ''
              }`}
              onClick={() => handleProClick(d)}
            >
              {proLocked && (
                <span className="absolute -top-1 -right-1 text-[8px]">&#128274;</span>
              )}
              {d.replace('pro_', '')} DAYS
            </button>
          ))}
        </div>

        {/* Upgrade prompt */}
        {showUpgrade && proLocked && (
          <div className="border border-crt-amber/20 bg-black/60 p-3 space-y-2 mt-2">
            <p className="text-[10px] text-crt-amber text-center font-pixel">
              UNLOCK PRO
            </p>
            <ul className="space-y-1">
              {PRO_BENEFITS_SHORT.map((b) => (
                <li key={b} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-crt-amber">+</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/upgrade"
              className="retro-btn retro-btn-amber block w-full py-2 text-[10px] text-center font-pixel mt-2"
            >
              GET PRO — $7.99
            </Link>
          </div>
        )}
      </div>

      <button
        className="retro-btn w-full py-2 text-xs font-pixel"
        onClick={onClose}
      >
        BACK
      </button>
    </div>
  );
}

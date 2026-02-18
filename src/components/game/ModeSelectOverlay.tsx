'use client';

import type { GameMode } from '@/engine/types';

interface ModeSelectOverlayProps {
  onClose: () => void;
  onModeSelected: (mode: GameMode) => void;
}

export function ModeSelectOverlay({ onClose, onModeSelected }: ModeSelectOverlayProps) {
  return (
    <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-6">
      <h2 className="font-pixel text-sm text-crt-cyan text-glow-blue">
        SELECT MODE
      </h2>

      {/* Classic Mode */}
      <div className="w-full retro-card p-4 space-y-3">
        <div className="text-center">
          <span className="font-pixel text-xs text-crt-cyan">CLASSIC</span>
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
          <p className="text-[10px] text-muted-foreground mt-1">
            Build an empire. Buy assets, travel cities, arm up.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['pro_30', 'pro_45', 'pro_60', 'pro_90'] as const).map((d) => (
            <button
              key={d}
              className="retro-btn retro-btn-amber py-2 text-[10px] font-pixel"
              onClick={() => onModeSelected(d)}
            >
              {d.replace('pro_', '')} DAYS
            </button>
          ))}
        </div>
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

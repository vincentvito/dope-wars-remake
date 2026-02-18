'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

const SCENARIOS = [
  {
    label: 'Negative Net Worth',
    netWorth: -12_450,
    daysSurvived: 8,
    maxDays: 30,
    isDead: true,
    gif: '/sprites/gameover/gameover-negative.gif',
  },
  {
    label: 'Low Net Worth ($0–$100k)',
    netWorth: 34_200,
    daysSurvived: 30,
    maxDays: 30,
    isDead: false,
    gif: '/sprites/gameover/gameover-low.gif',
  },
  {
    label: 'High Net Worth (>$100k)',
    netWorth: 487_650,
    daysSurvived: 30,
    maxDays: 30,
    isDead: false,
    gif: '/sprites/gameover/gameover-high.gif',
  },
] as const;

const PRO_BENEFITS = [
  'Global flight paths & sea routes',
  'Warehouse & fleet capacity',
  'Persistent "Heat" levels & Federal investigations',
  'Cash, Crypto, and Laundered Assets',
  'Build a self-sustaining global empire',
];

export default function GameOverPreview() {
  const [expandedPro, setExpandedPro] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-neutral-950 py-10 px-4">
      <h1 className="font-pixel text-crt-green text-glow-green text-center text-lg mb-2">
        Game Over Preview
      </h1>
      <p className="text-center text-xs text-muted-foreground mb-10">
        All 3 net worth tiers side by side
      </p>

      <div className="flex flex-wrap justify-center gap-8">
        {SCENARIOS.map((s, i) => {
          const isPositive = s.netWorth >= 0;
          const glowClass = s.isDead || !isPositive
            ? 'text-crt-red text-glow-red'
            : 'text-crt-green text-glow-green';

          return (
            <div key={i} className="flex flex-col items-center gap-3">
              {/* Label */}
              <div className="text-[10px] text-muted-foreground font-pixel text-center">
                {s.label}
              </div>

              {/* Phone frame */}
              <div
                className="relative w-[360px] h-[640px] overflow-hidden border border-white/10 rounded-sm"
                style={{ imageRendering: 'pixelated' }}
              >
                {/* GIF background */}
                <img
                  src={s.gif}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center opacity-35 pointer-events-none"
                  style={{ imageRendering: 'pixelated' }}
                  draggable={false}
                />

                {/* Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 gap-6">
                  {/* Title */}
                  <div className="text-center space-y-3">
                    <h2 className={`font-pixel text-2xl ${glowClass}`}>
                      GAME OVER
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      You survived {s.daysSurvived} / {s.maxDays} days
                    </p>
                  </div>

                  {/* Net Worth */}
                  <div className="text-center space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Net Worth
                    </div>
                    <div className={`font-pixel text-xl ${isPositive ? 'text-crt-green text-glow-green' : 'text-crt-red text-glow-red'}`}>
                      {formatCurrency(s.netWorth)}
                    </div>
                  </div>

                  {/* Submit button (static preview) */}
                  <div className="w-full">
                    <button className="retro-btn retro-btn-amber w-full py-2.5 text-xs font-bold font-pixel pointer-events-none">
                      SUBMIT TO LEADERBOARD
                    </button>
                  </div>

                  {/* Play Again */}
                  <button className="retro-btn w-full py-3 text-xs font-bold font-pixel pointer-events-none">
                    PLAY AGAIN
                  </button>

                  {/* Go Pro */}
                  <div className="w-full space-y-2">
                    <button
                      className="retro-btn retro-btn-amber w-full py-3 text-xs font-bold font-pixel"
                      onClick={() => setExpandedPro(expandedPro === i ? null : i)}
                    >
                      GO PRO
                    </button>
                    {expandedPro === i && (
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

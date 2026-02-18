'use client';

import type { CityDefinition } from '@/engine/types';
import { formatCurrency } from '@/lib/utils';

const DANGER_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Safe', color: 'text-muted-foreground' },
  2: { text: 'Low risk', color: 'text-muted-foreground' },
  3: { text: 'Moderate', color: 'text-muted-foreground' },
  4: { text: 'Dangerous', color: 'text-muted-foreground' },
  5: { text: 'Extreme', color: 'text-muted-foreground' },
};

interface CityCardProps {
  city: CityDefinition;
  isCurrent: boolean;
  isUnlocked: boolean;
  travelCost: number;
  onTravel: () => void;
}

export function CityCard({ city, isCurrent, isUnlocked, travelCost, onTravel }: CityCardProps) {
  const danger = DANGER_LABELS[city.dangerLevel] ?? DANGER_LABELS[3];
  const isLocked = !isUnlocked && !isCurrent;

  return (
    <div
      className={`retro-card p-3 transition-all ${
        isLocked
          ? 'border-dashed border-muted-foreground/30 opacity-60'
          : isCurrent
            ? 'border-crt-cyan/30 opacity-50'
            : 'border-border hover:border-crt-cyan/50 cursor-pointer'
      }`}
      onClick={!isLocked && !isCurrent ? onTravel : undefined}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-xs text-foreground">
            {isLocked ? '🔒 ' : ''}{city.name}
          </div>
          <div className={`text-[10px] mt-0.5 ${danger.color}`}>
            {danger.text}
          </div>
        </div>

        <div className="text-right">
          {isLocked ? (
            <div className="text-[10px] text-muted-foreground">
              Requires: {city.unlockRequirements.assets.join(', ')}
            </div>
          ) : !isCurrent ? (
            <div className="text-[10px]">
              {travelCost > 0 ? (
                <span className="text-crt-amber">{formatCurrency(travelCost)}</span>
              ) : (
                <span className="text-crt-green">FREE</span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useGameStore } from '@/stores/game-store';
import { DISTRICTS } from '@/engine/constants';
import { CITIES } from '@/engine/pro-constants';
import type { DistrictName, LocationName } from '@/engine/types';
import { formatCurrency } from '@/lib/utils';
import { CityCard } from './CityCard';

const DANGER_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Safe', color: 'text-muted-foreground' },
  2: { text: 'Low risk', color: 'text-muted-foreground' },
  3: { text: 'Moderate', color: 'text-muted-foreground' },
  4: { text: 'Dangerous', color: 'text-muted-foreground' },
  5: { text: 'Extreme', color: 'text-muted-foreground' },
};

export function ProTravelScreen() {
  const state = useGameStore((s) => s.proGameState);
  const travelPro = useGameStore((s) => s.travelPro);
  const canTravelToPro = useGameStore((s) => s.canTravelToPro);
  const getTravelCost = useGameStore((s) => s.getProTravelCost);

  if (!state) return null;

  const isLastDay = state.currentDay >= state.maxDays - 1;

  const handleTravel = (destination: LocationName) => {
    travelPro(destination);
  };

  return (
    <div className="space-y-4">
      {isLastDay && (
        <div className="px-3 py-2 text-xs border border-crt-red text-crt-red bg-crt-red/5">
          Warning: This is the last day! Traveling will end the game.
        </div>
      )}

      {/* NYC Districts */}
      <div>
        <h3 className="font-pixel text-[10px] text-muted-foreground mb-2">NYC DISTRICTS</h3>
        <div className="grid grid-cols-2 gap-2">
          {DISTRICTS.map((district) => {
            const isCurrent = district.name === state.currentDistrict;
            const danger = DANGER_LABELS[district.dangerLevel] ?? DANGER_LABELS[2];

            return (
              <button
                key={district.name}
                onClick={() => handleTravel(district.name)}
                disabled={isCurrent}
                className={`
                  retro-card p-3 text-left transition-all
                  ${isCurrent
                    ? 'border-crt-cyan/30 opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-crt-cyan/50 hover:bg-[var(--row-hover)] cursor-pointer'
                  }
                `}
              >
                <div className="font-pixel text-[10px] text-foreground mb-1">
                  {district.name}
                </div>
                <div className={`text-[10px] ${danger.color}`}>
                  {danger.text}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cities */}
      <div>
        <h3 className="font-pixel text-[10px] text-muted-foreground mb-2">CITIES</h3>
        <div className="space-y-2">
          {CITIES.map((city) => (
            <CityCard
              key={city.name}
              city={city}
              isCurrent={city.name === state.currentDistrict}
              isUnlocked={canTravelToPro(city.name)}
              travelCost={getTravelCost(city.name)}
              onTravel={() => handleTravel(city.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

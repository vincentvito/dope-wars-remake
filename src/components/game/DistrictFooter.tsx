'use client';

import { useGameStore } from '@/stores/game-store';
import { DISTRICTS } from '@/engine/constants';
import type { DistrictName } from '@/engine/types';

export function DistrictFooter() {
  const phase = useGameStore((s) => s.gameState?.phase);
  const currentDistrict = useGameStore((s) => s.gameState?.currentDistrict);
  const travel = useGameStore((s) => s.travel);

  if (phase !== 'market') return null;

  const handleTravel = (destination: DistrictName) => {
    travel(destination);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 text-shadow-sm bg-black/25 backdrop-blur-md">
      <div className="max-w-3xl mx-auto grid grid-cols-3 gap-2 px-3 py-3">
        {DISTRICTS.map((district) => {
          const isCurrent = district.name === currentDistrict;
          return (
            <button
              key={district.name}
              onClick={() => handleTravel(district.name)}
              disabled={isCurrent}
              className={`font-pixel text-[8px] py-2.5 px-3 text-center truncate transition-colors border rounded ${
                isCurrent
                  ? 'text-crt-cyan border-crt-cyan bg-crt-cyan/10 cursor-default'
                  : 'text-muted-foreground border-border hover:text-crt-cyan hover:border-crt-cyan cursor-pointer'
              }`}
            >
              {district.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { DISTRICTS } from '@/engine/constants';
import type { DistrictName } from '@/engine/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DANGER_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Safe', color: 'text-muted-foreground' },
  2: { text: 'Low risk', color: 'text-muted-foreground' },
  3: { text: 'Moderate', color: 'text-muted-foreground' },
  4: { text: 'Dangerous', color: 'text-muted-foreground' },
  5: { text: 'Extreme', color: 'text-muted-foreground' },
};

export function TravelMap() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const travel = useGameStore((s) => s.travel);
  const currentDistrict = useGameStore((s) => s.gameState?.currentDistrict);
  const currentDay = useGameStore((s) => s.gameState?.currentDay ?? 1);
  const maxDays = useGameStore((s) => s.gameState?.maxDays ?? 31);

  const isOpen = activeModal === 'travel';
  const isLastDay = currentDay >= maxDays - 1;

  const handleTravel = (destination: DistrictName) => {
    travel(destination);
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="retro-card border-crt-green/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-crt-green text-glow-green">
            Subway from {currentDistrict}
          </DialogTitle>
        </DialogHeader>

        {isLastDay && (
          <div className="px-3 py-2 text-xs border border-crt-red text-crt-red bg-crt-red/5">
            Warning: This is the last day! Traveling will end the game.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {DISTRICTS.map((district) => {
            const isCurrent = district.name === currentDistrict;
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
                    : 'border-border hover:border-crt-green/50 hover:bg-[var(--row-hover)] cursor-pointer'
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
      </DialogContent>
    </Dialog>
  );
}

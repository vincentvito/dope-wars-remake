'use client';

import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { WEAPON_DEFINITIONS, MAX_ARMORY_SIZE } from '@/engine/pro-constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TIER_COLORS: Record<string, string> = {
  Pistol: 'text-muted-foreground',
  SMG: 'text-crt-cyan',
  Rifle: 'text-crt-amber',
  Heavy: 'text-crt-red',
};

export function ArmoryModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const state = useGameStore((s) => s.proGameState);
  const discardWeapon = useGameStore((s) => s.discardWeapon);

  const isOpen = activeModal === 'armory';

  if (!isOpen || !state) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="retro-card border-crt-cyan/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-crt-cyan text-glow-blue">
            Armory ({state.armory.length}/{MAX_ARMORY_SIZE})
          </DialogTitle>
        </DialogHeader>

        {state.armory.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No weapons. Find them during travel.
          </div>
        ) : (
          <div className="space-y-2">
            {state.armory.map((weapon, index) => {
              const def = WEAPON_DEFINITIONS.find((w) => w.name === weapon.name);
              if (!def) return null;

              const tierColor = TIER_COLORS[weapon.tier] ?? 'text-foreground';

              return (
                <div key={index} className="retro-card p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-pixel text-[10px] text-foreground">{weapon.name}</span>
                      <span className={`font-pixel text-[10px] ${tierColor}`}>
                        [{weapon.tier}]
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px]">
                      <span className="text-crt-green">+{def.damageBonus} DMG</span>
                      <span className="text-crt-red">-{def.runPenalty}% RUN</span>
                    </div>
                  </div>
                  <button
                    className="retro-btn retro-btn-red text-[10px] py-1 px-2"
                    onClick={() => discardWeapon(index)}
                  >
                    DROP
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

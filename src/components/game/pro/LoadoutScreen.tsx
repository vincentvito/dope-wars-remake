'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/game-store';
import { WEAPON_DEFINITIONS, MAX_LOADOUT_SIZE } from '@/engine/pro-constants';
import { getLoadoutDamageBonus, getLoadoutRunPenalty } from '@/engine/armory';

const TIER_COLORS: Record<string, string> = {
  Pistol: 'text-muted-foreground',
  SMG: 'text-crt-cyan',
  Rifle: 'text-crt-amber',
  Heavy: 'text-crt-red',
};

export function LoadoutScreen() {
  const state = useGameStore((s) => s.proGameState);
  const selectLoadoutAction = useGameStore((s) => s.selectLoadout);
  const [selected, setSelected] = useState<number[]>([]);

  if (!state || state.phase !== 'loadout' || !state.proCombat) return null;

  const encounterName = {
    police: 'POLICE',
    dea: 'DEA AGENTS',
    swat: 'SWAT TEAM',
  }[state.proCombat.encounterType];

  const encounterColor = {
    police: 'text-crt-amber',
    dea: 'text-crt-red',
    swat: 'text-crt-red text-glow-red',
  }[state.proCombat.encounterType];

  const toggleWeapon = (index: number) => {
    if (selected.includes(index)) {
      setSelected(selected.filter((i) => i !== index));
    } else if (selected.length < MAX_LOADOUT_SIZE) {
      setSelected([...selected, index]);
    }
  };

  const selectedWeapons = selected.map((i) => state.armory[i]);
  const totalDamage = getLoadoutDamageBonus(selectedWeapons);
  const totalPenalty = getLoadoutRunPenalty(selectedWeapons);

  const handleEngage = () => {
    selectLoadoutAction(selected);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-start pt-[10vh] overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-4 pb-10">
        {/* Title */}
        <h2 className="font-pixel text-lg text-crt-cyan text-glow-blue">
          CHOOSE YOUR LOADOUT
        </h2>
        <div className={`font-pixel text-xs ${encounterColor}`}>
          Encounter: {encounterName}
        </div>

        {/* Weapon grid */}
        <div className="w-full space-y-2">
          {state.armory.map((weapon, index) => {
            const def = WEAPON_DEFINITIONS.find((w) => w.name === weapon.name);
            if (!def) return null;

            const isSelected = selected.includes(index);
            const tierColor = TIER_COLORS[weapon.tier] ?? 'text-foreground';

            return (
              <button
                key={index}
                onClick={() => toggleWeapon(index)}
                className={`retro-card w-full p-3 text-left transition-all ${
                  isSelected
                    ? 'border-crt-cyan bg-crt-cyan/10'
                    : 'border-border hover:border-crt-cyan/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-pixel text-[10px] text-foreground">{weapon.name}</span>
                    <span className={`font-pixel text-[10px] ml-2 ${tierColor}`}>
                      [{weapon.tier}]
                    </span>
                  </div>
                  <div className="text-[10px] flex gap-3">
                    <span className="text-crt-green">+{def.damageBonus} DMG</span>
                    <span className="text-crt-red">-{def.runPenalty}% RUN</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div className="w-full retro-card p-3">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">
              Selected: {selected.length}/{MAX_LOADOUT_SIZE}
            </span>
            <div className="flex gap-3">
              <span className="text-crt-green">+{totalDamage} DMG</span>
              <span className="text-crt-red">-{totalPenalty}% RUN</span>
            </div>
          </div>
        </div>

        {/* Consumption warning */}
        <div className="text-[10px] text-crt-amber text-center">
          Weapons used in combat will be consumed.
        </div>

        {/* Engage button */}
        <button
          className="retro-btn retro-btn-red w-full py-3 text-xs font-bold font-pixel"
          onClick={handleEngage}
        >
          ARM & FIGHT!
        </button>
      </div>
    </div>
  );
}

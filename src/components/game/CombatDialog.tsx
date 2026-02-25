'use client';

import { useGameStore } from '@/stores/game-store';
import { useCombatAnimation } from './combat/useCombatAnimation';

const ENCOUNTER_NAMES: Record<string, string> = {
  police: 'Officer Hardass',
  dea: 'DEA Agent',
  swat: 'SWAT Team',
};

const ENCOUNTER_TITLES: Record<string, string> = {
  police: 'Police Encounter!',
  dea: 'DEA Raid!',
  swat: 'SWAT ASSAULT!',
};

export function CombatDialog() {
  const isPro = useGameStore((s) => s.isPro);
  const phase = useGameStore((s) => s.isPro ? s.proGameState?.phase : s.gameState?.phase);
  const health = useGameStore((s) => s.isPro ? (s.proGameState?.health ?? 0) : (s.gameState?.health ?? 0));
  const combat = useGameStore((s) => s.isPro ? s.proGameState?.proCombat : s.gameState?.combat);
  const proCombat = useGameStore((s) => s.proGameState?.proCombat);
  const guns = useGameStore((s) => s.gameState?.guns ?? 0);
  const { isAnimating, isShaking, buffered, handleFight, handleRun } =
    useCombatAnimation();

  const isOpen = phase === 'combat' && combat != null;

  if (!isOpen || !combat) return null;

  const displayHealth = buffered?.playerHealth ?? health;
  const displayOfficerHealth = buffered?.officerHealth ?? combat.officerHealth;
  const displayOfficerMax = buffered?.officerMaxHealth ?? combat.officerMaxHealth;
  const displayMessage = buffered?.lastMessage ?? combat.lastMessage;

  const officerHealthPct = (displayOfficerHealth / displayOfficerMax) * 100;
  const playerHealthPct = displayHealth;

  // Pro mode details
  const encounterType = proCombat?.encounterType ?? 'police';
  const enemyName = ENCOUNTER_NAMES[encounterType] ?? 'Officer Hardass';
  const title = ENCOUNTER_TITLES[encounterType] ?? 'Police Encounter!';
  const isSwat = encounterType === 'swat';

  // Player info line
  const playerInfo = isPro
    ? `${displayHealth}HP`
    : `${displayHealth}HP | ${buffered?.guns ?? guns} gun${(buffered?.guns ?? guns) !== 1 ? 's' : ''}`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-start pt-[15vh] overflow-hidden">
      {/* Full-screen GIF background */}
      <img
        src="/sprites/combat/combat-idle.gif"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35 pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
        draggable={false}
        decoding="async"
      />

      {/* Vignette overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Red flash overlay during shake */}
      {isShaking && (
        <div
          className="fixed inset-0 bg-crt-red pointer-events-none z-[60]"
          style={{ animation: 'combat-flash 0.4s ease-out forwards' }}
        />
      )}

      {/* Content overlay */}
      <div
        className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-4"
        style={isShaking ? { animation: 'combat-shake 0.4s ease-out' } : undefined}
      >
        {/* Title */}
        <h2 className={`font-pixel text-lg text-crt-red ${isSwat ? 'text-glow-red animate-pulse' : 'text-glow-red'}`}>
          {title}
        </h2>

        {/* Combat message */}
        <p className="text-sm text-foreground text-center">{displayMessage}</p>

        {/* Health bars */}
        <div className="w-full space-y-2">
          {/* Player health */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-crt-green">You</span>
              <span className="text-muted-foreground">{playerInfo}</span>
            </div>
            <div className="h-2 bg-muted rounded-sm overflow-hidden border border-border">
              <div
                className={`h-full transition-all duration-300 ${
                  playerHealthPct > 50 ? 'bg-crt-green' : playerHealthPct > 25 ? 'bg-crt-amber' : 'bg-crt-red'
                }`}
                style={{ width: `${playerHealthPct}%` }}
              />
            </div>
          </div>

          {/* Officer health */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-crt-red">{enemyName}</span>
              <span className="text-muted-foreground">{displayOfficerHealth}HP</span>
            </div>
            <div className="h-2 bg-muted rounded-sm overflow-hidden border border-border">
              <div
                className="h-full bg-crt-red transition-all duration-300"
                style={{ width: `${officerHealthPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Loadout indicator (Pro) */}
        {isPro && proCombat && proCombat.selectedLoadout.length > 0 && (
          <div className="text-[10px] text-muted-foreground">
            Loadout: {proCombat.selectedLoadout.map((w) => w.name).join(', ')}
          </div>
        )}

        {/* Round counter */}
        <div className="text-center text-[10px] text-muted-foreground">
          Round {combat.roundsElapsed + 1}
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <button
            className="retro-btn retro-btn-red flex-1 py-2 text-xs font-bold"
            onClick={handleFight}
            disabled={isAnimating}
          >
            Fight!
          </button>
          <button
            className="retro-btn retro-btn-amber flex-1 py-2 text-xs font-bold"
            onClick={handleRun}
            disabled={isAnimating}
          >
            Run!
          </button>
        </div>
      </div>
    </div>
  );
}

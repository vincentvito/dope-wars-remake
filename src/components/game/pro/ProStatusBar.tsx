'use client';

import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { formatCurrency } from '@/lib/utils';
import { SettingsMenu } from '../SettingsMenu';

export function ProStatusBar() {
  const state = useGameStore((s) => s.proGameState);
  const netWorth = useGameStore((s) => s.netWorth);
  const openModal = useUIStore((s) => s.openModal);

  if (!state) return null;

  const usedSpace = state.inventory.reduce((sum, s) => sum + s.quantity, 0);
  const healthPercent = state.health;
  const dayProgress = ((state.currentDay - 1) / (state.maxDays - 2)) * 100;

  return (
    <div className="glass-panel p-4 space-y-2 text-shadow-sm">
      {/* Day counter */}
      <div className="flex items-center justify-between">
        <span className="font-pixel text-sm text-crt-cyan">
          Day {state.currentDay} / {state.maxDays - 1}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs text-crt-cyan">
            {state.currentDistrict}
          </span>
          <SettingsMenu />
        </div>
      </div>

      {/* Day progress bar */}
      <div className="h-1 bg-muted rounded-sm overflow-hidden">
        <div
          className="h-full bg-crt-cyan transition-all duration-300"
          style={{ width: `${Math.min(100, dayProgress)}%` }}
        />
      </div>

      {/* Financial stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Cash:</span>{' '}
          <span className="text-crt-green text-glow-green font-bold">
            {formatCurrency(state.cash)}
          </span>
        </div>
        <button
          className="text-left cursor-pointer hover:underline"
          onClick={() => openModal('bank')}
        >
          <span className="text-muted-foreground">Bank:</span>{' '}
          <span className="text-foreground">
            {formatCurrency(state.bank)}
          </span>
        </button>
        <button
          className="text-left cursor-pointer hover:underline"
          onClick={() => openModal('loanShark')}
        >
          <span className="text-muted-foreground">Debt:</span>{' '}
          <span className={`text-crt-red ${state.debt > 0 ? 'text-glow-red' : ''}`}>
            {formatCurrency(state.debt)}
          </span>
        </button>
        <div>
          <span className="text-muted-foreground">Net:</span>{' '}
          <span className={netWorth >= 0 ? 'text-crt-green' : 'text-crt-red'}>
            {formatCurrency(netWorth)}
          </span>
        </div>
      </div>

      {/* Health + Stash + Armory */}
      <div className="flex items-center gap-3 text-xs flex-wrap">
        {/* Health bar */}
        <div className="flex items-center gap-2 flex-1 min-w-[120px]">
          <span className="text-muted-foreground">HP:</span>
          <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden border border-border">
            <div
              className={`h-full transition-all duration-300 bg-crt-cyan ${
                healthPercent <= 30 ? 'health-low' : ''
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <span className="text-crt-cyan">{healthPercent}%</span>
        </div>

        {/* Stash space */}
        <div>
          <span className="text-muted-foreground">Stash:</span>{' '}
          <span className="text-foreground">{usedSpace}/{state.trenchcoatSpace}</span>
        </div>

        {/* Armory */}
        <button
          className="cursor-pointer hover:underline"
          onClick={() => openModal('armory')}
        >
          <span className="text-muted-foreground">Armory:</span>{' '}
          <span className="text-crt-cyan">{state.armory.length}/10</span>
        </button>

      </div>
    </div>
  );
}

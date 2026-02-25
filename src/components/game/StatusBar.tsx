'use client';

import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { useShallow } from 'zustand/react/shallow';
import { formatCurrency } from '@/lib/utils';
import { SettingsMenu } from './SettingsMenu';

export function StatusBar() {
  const { cash, bank, debt, health, inventory, currentDay, maxDays, currentDistrict, trenchcoatSpace, guns } =
    useGameStore(useShallow((s) => ({
      cash: s.gameState?.cash ?? 0,
      bank: s.gameState?.bank ?? 0,
      debt: s.gameState?.debt ?? 0,
      health: s.gameState?.health ?? 0,
      inventory: s.gameState?.inventory ?? [],
      currentDay: s.gameState?.currentDay ?? 1,
      maxDays: s.gameState?.maxDays ?? 31,
      currentDistrict: s.gameState?.currentDistrict ?? '',
      trenchcoatSpace: s.gameState?.trenchcoatSpace ?? 0,
      guns: s.gameState?.guns ?? 0,
    })));
  const netWorth = useGameStore((s) => s.netWorth);
  const openModal = useUIStore((s) => s.openModal);

  if (!currentDistrict) return null;

  const usedSpace = inventory.reduce((sum, s) => sum + s.quantity, 0);
  const healthPercent = health;
  const dayProgress = ((currentDay - 1) / (maxDays - 2)) * 100;

  return (
    <div className="glass-panel p-4 space-y-2 text-shadow-sm">
      {/* Day counter */}
      <div className="flex items-center justify-between">
        <span className="font-pixel text-sm text-crt-cyan">
          Day {currentDay} / {maxDays - 1}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs text-crt-cyan">
            {currentDistrict}
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
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Cash:</span>{' '}
          <span className="text-crt-green text-glow-green font-bold">
            {formatCurrency(cash)}
          </span>
        </div>
        <button
          className="text-left cursor-pointer hover:underline"
          onClick={() => openModal('bank')}
        >
          <span className="text-muted-foreground">Bank:</span>{' '}
          <span className="text-foreground">
            {formatCurrency(bank)}
          </span>
        </button>
        <button
          className="text-left cursor-pointer hover:underline"
          onClick={() => openModal('loanShark')}
        >
          <span className="text-muted-foreground">Debt:</span>{' '}
          <span className={`text-crt-red ${debt > 0 ? 'text-glow-red' : ''}`}>
            {formatCurrency(debt)}
          </span>
        </button>
        <div>
          <span className="text-muted-foreground">Net:</span>{' '}
          <span className={netWorth >= 0 ? 'text-crt-green' : 'text-crt-red'}>
            {formatCurrency(netWorth)}
          </span>
        </div>
      </div>

      {/* Health + Space + Guns */}
      <div className="flex items-center gap-4 text-xs">
        {/* Health bar */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-muted-foreground">HP:</span>
          <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden border border-border">
            <div
              className={`h-full transition-all duration-300 bg-crt-cyan ${
                healthPercent <= 30 ? 'health-low' : ''
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <span className="text-crt-cyan">
            {healthPercent}%
          </span>
        </div>

        {/* Trenchcoat space */}
        <div>
          <span className="text-muted-foreground">Coat:</span>{' '}
          <span className="text-foreground">{usedSpace}/{trenchcoatSpace}</span>
        </div>

        {/* Guns */}
        <div>
          <span className="text-muted-foreground">Guns:</span>{' '}
          <span className="text-foreground">{guns}</span>
        </div>
      </div>
    </div>
  );
}

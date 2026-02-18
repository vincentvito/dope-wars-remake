'use client';

import { useGameStore } from '@/stores/game-store';
import { ProStatusBar } from './ProStatusBar';
import { ProTabContent } from './ProTabContent';
import { ProTabBar } from './ProTabBar';
import { LoadoutScreen } from './LoadoutScreen';
import { ArmoryModal } from './ArmoryModal';
import { LabModal } from './LabModal';
import { BuySellDialog } from '../BuySellDialog';
import { EventDialog } from '../EventDialog';
import { CombatDialog } from '../CombatDialog';
import { BankDialog } from '../BankDialog';
import { LoanSharkDialog } from '../LoanSharkDialog';
import { GameToast } from '../GameToast';
import { GameOverScreen } from '../GameOverScreen';

export function ProGameShell() {
  const state = useGameStore((s) => s.proGameState);

  if (!state) return null;

  if (state.phase === 'game_over') {
    return <GameOverScreen />;
  }

  return (
    <>
      <div className="flex flex-col h-[100dvh] max-w-3xl mx-auto px-3 relative z-10">
        <div className="shrink-0 pt-3 space-y-3">
          <ProStatusBar />
          {state.marketEvents.length > 0 && (
            <div className="space-y-1">
              {state.marketEvents.map((event, i) => (
                <div
                  key={i}
                  className="px-3 py-2 text-xs border border-crt-cyan text-crt-cyan bg-[var(--card)]/90 backdrop-blur-sm"
                >
                  {event.message}
                </div>
              ))}
            </div>
          )}
          <GameToast />
        </div>

        <div className="flex-1 overflow-y-auto pt-3 pb-24">
          <ProTabContent />
        </div>
      </div>

      <ProTabBar />

      {/* Overlays */}
      <BuySellDialog />
      <EventDialog />
      <CombatDialog />
      <BankDialog />
      <LoanSharkDialog />
      <LoadoutScreen />
      <ArmoryModal />
      <LabModal />
    </>
  );
}

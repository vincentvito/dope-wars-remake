'use client';

import { MarketNews } from '../MarketNews';
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
  const phase = useGameStore((s) => s.proGameState?.phase);

  if (!phase) return null;

  if (phase === 'game_over') {
    return <GameOverScreen />;
  }

  return (
    <>
      <div className="game-scroll h-[100dvh] overflow-y-auto max-w-3xl mx-auto px-3 relative z-10">
        <div className="shrink-0 pt-3 space-y-3">
          <ProStatusBar />
          <MarketNews />
          <GameToast />
        </div>

        <div className="pt-3 pb-6">
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

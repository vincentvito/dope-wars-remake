'use client';

import { MarketNews } from './MarketNews';
import { useGameStore } from '@/stores/game-store';
import { StatusBar } from './StatusBar';
import { MarketView } from './MarketView';
import { DistrictFooter } from './DistrictFooter';
import { BuySellDialog } from './BuySellDialog';
import { TravelMap } from './TravelMap';
import { EventDialog } from './EventDialog';
import { CombatDialog } from './CombatDialog';
import { BankDialog } from './BankDialog';
import { LoanSharkDialog } from './LoanSharkDialog';
import { GameToast } from './GameToast';
import { GameOverScreen } from './GameOverScreen';
import { ProGameShell } from './pro/ProGameShell';

export function GameShell() {
  const isPro = useGameStore((s) => s.isPro);
  const phase = useGameStore((s) => s.gameState?.phase);

  if (isPro) return <ProGameShell />;
  if (!phase) return null;

  if (phase === 'game_over') {
    return <GameOverScreen />;
  }

  return (
    <>
      <div className="game-scroll h-[100dvh] overflow-y-auto max-w-3xl mx-auto px-3 relative z-10">
        <div className="shrink-0 pt-3 space-y-3">
          <StatusBar />
          <MarketNews />
          <GameToast />
        </div>

        <div
          className="pt-3 pb-6"
        >
          <MarketView />
        </div>
      </div>

      <DistrictFooter />

      <BuySellDialog />
      <TravelMap />
      <EventDialog />
      <CombatDialog />
      <BankDialog />
      <LoanSharkDialog />
    </>
  );
}

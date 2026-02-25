'use client';

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
  const marketEvents = useGameStore((s) => s.gameState?.marketEvents);

  if (isPro) return <ProGameShell />;
  if (!phase) return null;

  if (phase === 'game_over') {
    return <GameOverScreen />;
  }

  return (
    <>
      <div className="flex flex-col h-[100dvh] max-w-3xl mx-auto px-3 relative z-10">
        <div className="shrink-0 pt-3 space-y-3">
          <StatusBar />
          {marketEvents && marketEvents.length > 0 && (
            <div className="space-y-1">
              {marketEvents.map((event, i) => (
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

        <div
          className="flex-1 overflow-y-auto pt-3 pb-24"
          style={{
            maskImage: 'linear-gradient(to bottom, black calc(100% - 100px), transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 100px), transparent)',
          }}
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

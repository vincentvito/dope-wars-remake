'use client';
import { useGameStore } from '@/stores/game-store';

export function MarketNews() {
  const state = useGameStore(s => s.isPro ? s.proGameState : s.gameState);
  const saveError = useGameStore(s => s.saveError);
  if (!state) return null;
  return (
    <div className="space-y-2 text-xs">
      {saveError ? <p role="status" className="text-crt-amber">{saveError}</p> : <p className="text-muted-foreground">Progress saved on this device</p>}
      {state.currentDay === 1 && (
        <details className="bg-background/80 border border-border p-2">
          <summary className="text-crt-cyan cursor-pointer">First run? Quick guide</summary>
          <p className="pt-2 leading-relaxed">Buy what you can afford, then travel to compare prices and sell for a profit. Each trip costs one day. Tap Bank to earn 5% daily interest or Debt to pay down your loan before its 10% daily interest grows. Unavailable drugs cannot be traded here.</p>
        </details>
      )}
      {state.marketEvents.length > 0 && (
        <section aria-labelledby="market-news-heading" className="border border-crt-cyan/40 bg-background/90 p-2">
          <h2 id="market-news-heading" className="text-crt-cyan">Market news · {state.marketEvents.length} price {state.marketEvents.length === 1 ? 'change' : 'changes'}</h2>
          <ul className="space-y-2 pt-2 text-crt-cyan">
            {state.marketEvents.map((event, i) => <li key={i}>{event.message}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

'use client';

import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { DRUGS } from '@/engine/constants';
import { formatCurrency } from '@/lib/utils';
import { CUTTABLE_DRUGS } from '@/engine/pro-constants';
import type { DrugName } from '@/engine/types';

export function MarketView() {
  const gameState = useGameStore((s) => s.gameState);
  const proGameState = useGameStore((s) => s.proGameState);
  const isPro = useGameStore((s) => s.isPro);
  const state = isPro ? proGameState : gameState;
  const hasLab = useGameStore((s) => s.proGameState?.assets.some((a) => a.type === 'Lab') ?? false);
  const showCut = isPro && hasLab;

  if (!state || state.phase !== 'market') return null;
  const gameState_ = state; // alias for template compatibility

  return (
    <div className="space-y-3">
      {/* Drug table */}
      <div className="glass-panel overflow-hidden text-shadow-sm">
        {/* Header row */}
        <div className="flex items-center px-3 py-1.5 text-[10px] tracking-wider text-muted-foreground">
          <div className="w-[64px]">DRUG</div>
          <div className="w-[72px]">PRICE</div>
          <div className="flex-1 flex justify-center gap-6">
            <span className="w-8 text-right">QTY</span>
            <span className="w-[72px] text-right">AVG COST</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-10 text-center">BUY</span>
            <span className="w-10 text-center">SELL</span>
          </div>
        </div>
        <div>
          {DRUGS.map((drug) => (
            <DrugRow
              key={drug.name}
              drug={drug.name}
              price={gameState_.market[drug.name] ?? null}
              owned={
                gameState_.inventory.find((s) => s.drug === drug.name)?.quantity ?? 0
              }
              avgBuyPrice={
                gameState_.inventory.find((s) => s.drug === drug.name)?.avgBuyPrice
              }
              showCut={showCut}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DrugRow({
  drug,
  price,
  owned,
  avgBuyPrice,
  showCut,
}: {
  drug: DrugName;
  price: number | null;
  owned: number;
  avgBuyPrice?: number;
  showCut: boolean;
}) {
  const openModal = useUIStore((s) => s.openModal);
  const isPro = useGameStore((s) => s.isPro);
  const cash = useGameStore((s) => s.isPro ? (s.proGameState?.cash ?? 0) : (s.gameState?.cash ?? 0));
  const availableSpace = useGameStore((s) => s.getAvailableSpace());

  const isAvailable = price != null;
  const canBuy = isAvailable && cash >= price && availableSpace > 0;
  const canSell = owned > 0 && isAvailable;
  const isCuttable = showCut && CUTTABLE_DRUGS.has(drug);

  return (
    <div className="flex items-center px-3 py-2 text-xs hover:bg-[var(--row-hover)] transition-colors">
      {/* Drug name */}
      <div className="w-[64px] font-medium">
        {isCuttable ? (
          <button
            className="text-left text-foreground cursor-pointer hover:underline hover:text-crt-cyan transition-colors flex items-center gap-0.5"
            onClick={() => openModal('lab', drug)}
          >
            {drug}
            <span className="text-crt-cyan text-[8px] leading-none">{'\u2697'}</span>
          </button>
        ) : (
          <span className={isAvailable ? 'text-foreground' : 'text-muted-foreground line-through'}>
            {drug}
          </span>
        )}
      </div>

      {/* Price */}
      <div className="w-[72px]">
        {isAvailable ? (
          <span className="text-foreground">{formatCurrency(price)}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </div>

      {/* Qty + Avg Cost centered in remaining space */}
      <div className="flex-1 flex justify-center gap-6">
        <span className="w-8 text-right">
          {owned > 0 && (
            <span className="text-crt-cyan">{owned}</span>
          )}
        </span>
        <span className="w-[72px] text-right">
          {owned > 0 && avgBuyPrice != null && (
            <span className="text-muted-foreground">{formatCurrency(avgBuyPrice)}</span>
          )}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button
          className="retro-btn text-[10px] w-10 py-1 !px-0 flex items-center justify-center"
          disabled={!canBuy}
          onClick={() => openModal('buy', drug)}
        >
          BUY
        </button>
        <button
          className="retro-btn text-[10px] w-10 py-1 !px-0 flex items-center justify-center"
          disabled={!canSell}
          onClick={() => openModal('sell', drug)}
        >
          SELL
        </button>
      </div>
    </div>
  );
}

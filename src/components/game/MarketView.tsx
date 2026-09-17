'use client';

import { memo, useMemo } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { DRUGS } from '@/engine/constants';
import { formatCurrency } from '@/lib/utils';
import { CUTTABLE_DRUGS } from '@/engine/pro-constants';
import type { DrugName } from '@/engine/types';

export function MarketView() {
  const phase = useGameStore((s) => s.isPro ? s.proGameState?.phase : s.gameState?.phase);
  const market = useGameStore((s) => s.isPro ? s.proGameState?.market : s.gameState?.market);
  const inventory = useGameStore((s) => s.isPro ? s.proGameState?.inventory : s.gameState?.inventory);
  const isPro = useGameStore((s) => s.isPro);
  const hasLab = useGameStore((s) => s.proGameState?.assets.some((a) => a.type === 'Lab') ?? false);
  const showCut = isPro && hasLab;

  // Pre-compute inventory lookup map to avoid O(n) .find() per drug
  const inventoryMap = useMemo(() => {
    const map = new Map<string, { quantity: number; avgBuyPrice?: number }>();
    if (inventory) {
      for (const slot of inventory) {
        map.set(slot.drug, { quantity: slot.quantity, avgBuyPrice: slot.avgBuyPrice });
      }
    }
    return map;
  }, [inventory]);

  if (!market || phase !== 'market') return null;

  return (
    <div className="space-y-3">
      {/* Drug table */}
      <div className="market-table glass-panel overflow-hidden text-shadow-sm">
        {/* Header row */}
        <div className="market-row text-[10px] text-muted-foreground">
          <div className="min-w-0">DRUG</div>
          <div className="min-w-0">PRICE</div>
          <div className="text-center" title="Quantity owned">QTY</div>
          <div className="text-center" title="Average purchase price">AVG</div>
          <div className="market-actions market-action-headings">
            <span className="w-11 text-center">BUY</span>
            <span className="w-11 text-center">SELL</span>
          </div>
        </div>
        <div>
          {DRUGS.map((drug) => {
            const slot = inventoryMap.get(drug.name);
            return (
              <DrugRow
                key={drug.name}
                drug={drug.name}
                price={market[drug.name] ?? null}
                owned={slot?.quantity ?? 0}
                avgBuyPrice={slot?.avgBuyPrice}
                showCut={showCut}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const DrugRow = memo(function DrugRow({
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
  const cash = useGameStore((s) => s.isPro ? (s.proGameState?.cash ?? 0) : (s.gameState?.cash ?? 0));
  const availableSpace = useGameStore((s) => s.getAvailableSpace());

  const isAvailable = price != null;
  const canBuy = isAvailable && cash >= price && availableSpace > 0;
  const canSell = owned > 0 && isAvailable;
  const isCuttable = showCut && CUTTABLE_DRUGS.has(drug);

  return (
    <div className="market-row text-xs hover:bg-[var(--row-hover)] transition-colors">
      {/* Drug name */}
      <div className="min-w-0 font-medium">
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
      <div className="min-w-0">
        {isAvailable ? (
          <span className="text-foreground">{formatCurrency(price)}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </div>

      {/* Separate inventory columns share the header's centered alignment. */}
      <div className="min-w-0 text-center tabular-nums whitespace-nowrap">
        <span className="text-crt-cyan">{owned || '—'}</span>
      </div>
      <div className="min-w-0 text-center tabular-nums whitespace-nowrap text-muted-foreground" title="Average purchase price">
        {owned > 0 && avgBuyPrice != null ? formatCurrency(avgBuyPrice) : '—'}
      </div>

      {/* Actions */}
      <div className="market-actions">
        <button
          className="retro-btn text-[10px] w-11 py-1 !px-0 flex items-center justify-center"
          aria-label={`Buy ${drug}`}
          title={!isAvailable ? "Unavailable in this district" : availableSpace <= 0 ? "Your coat is full" : cash < price ? "Not enough cash" : `Buy ${drug}`}
          disabled={!canBuy}
          onClick={() => openModal('buy', drug)}
        >
          BUY
        </button>
        <button
          className="retro-btn text-[10px] w-11 py-1 !px-0 flex items-center justify-center"
          aria-label={`Sell ${drug}`}
          disabled={!canSell}
          onClick={() => openModal('sell', drug)}
        >
          SELL
        </button>
      </div>
    </div>
  );
});

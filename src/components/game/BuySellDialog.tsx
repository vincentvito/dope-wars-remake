'use client';

import { useState, useCallback, useId, type CSSProperties } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { formatCurrency } from '@/lib/utils';
import type { DrugName } from '@/engine/types';
import styles from './BuySellDialog.module.css';

export function BuySellDialog() {
  const activeModal = useUIStore((s) => s.activeModal);
  const selectedDrug = useUIStore((s) => s.selectedDrug) as DrugName | null;
  const closeModal = useUIStore((s) => s.closeModal);
  const addNotification = useUIStore((s) => s.addNotification);
  const market = useGameStore((s) => s.isPro ? s.proGameState?.market : s.gameState?.market);
  const inventory = useGameStore((s) => s.isPro ? s.proGameState?.inventory : s.gameState?.inventory);
  const cash = useGameStore((s) => s.isPro ? (s.proGameState?.cash ?? 0) : (s.gameState?.cash ?? 0));
  const buyDrug = useGameStore((s) => s.buyDrug);
  const sellDrug = useGameStore((s) => s.sellDrug);
  const getMaxBuy = useGameStore((s) => s.getMaxBuy);

  const [quantity, setQuantity] = useState(0);
  const quantityId = useId();

  const isBuy = activeModal === 'buy';
  const isSell = activeModal === 'sell';
  const isOpen = (isBuy || isSell) && selectedDrug != null;

  const price = selectedDrug && market ? (market[selectedDrug] ?? 0) : 0;
  const owned = selectedDrug
    ? inventory?.find((s) => s.drug === selectedDrug)?.quantity ?? 0
    : 0;

  const maxQty = isBuy
    ? (selectedDrug ? getMaxBuy(selectedDrug) : 0)
    : owned;

  const clampAndSet = useCallback(
    (val: number) => setQuantity(Math.min(maxQty, Math.max(0, val))),
    [maxQty]
  );

  const totalCost = price * quantity;

  const handleConfirm = useCallback(() => {
    if (!selectedDrug || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > maxQty) return;

    if (isBuy) {
      if (!buyDrug(selectedDrug, quantity)) return;
      addNotification(
        `Bought ${quantity} ${selectedDrug} @ ${formatCurrency(price)}`,
        'neutral'
      );
    } else {
      const avgBuyPrice = inventory?.find((s) => s.drug === selectedDrug)?.avgBuyPrice ?? price;
      const pnl = (price - avgBuyPrice) * quantity;
      if (!sellDrug(selectedDrug, quantity)) return;
      const sign = pnl >= 0 ? '+' : '-';
      const colorType = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'neutral';
      addNotification(
        `Sold ${quantity} ${selectedDrug} · P&L: ${sign}${formatCurrency(Math.abs(pnl))}`,
        colorType
      );
    }

    setQuantity(0);
    closeModal();
  }, [selectedDrug, quantity, maxQty, isBuy, price, inventory, buyDrug, sellDrug, addNotification, closeModal]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setQuantity(0);
      closeModal();
    }
  }, [closeModal]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="retro-card border-crt-green/30 max-w-sm"
        onOpenAutoFocus={event => {
          if (maxQty > 0) {
            event.preventDefault();
            document.getElementById(quantityId)?.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-crt-green text-glow-green">
            {isBuy ? 'Buy' : 'Sell'} {selectedDrug}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price info */}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Price per unit:</span>
            <span className="text-crt-amber">{formatCurrency(price)}</span>
          </div>

          {isBuy && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Your cash:</span>
              <span className="text-crt-green">{formatCurrency(cash)}</span>
            </div>
          )}

          {isSell && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">You own:</span>
              <span className="text-crt-cyan">{owned}</span>
            </div>
          )}

          <div className="border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={quantityId} className="text-xs text-muted-foreground">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Exact quantity"
                  min={0}
                  max={maxQty}
                  step={1}
                  value={quantity}
                  disabled={maxQty === 0}
                  onChange={e => clampAndSet(Math.floor(Number(e.target.value) || 0))}
                  className={`${styles.quantity} w-20 min-h-11 border border-border bg-background px-2 text-center text-lg tabular-nums ${isSell ? 'text-crt-amber' : 'text-crt-green'}`}
                />
                <span className="text-xs text-muted-foreground">units</span>
              </div>
            </div>
            <input
              id={quantityId}
              type="range"
              min={0}
              max={maxQty}
              step={1}
              value={quantity}
              disabled={maxQty === 0}
              aria-valuetext={`${quantity} of ${maxQty} units`}
              onChange={e => clampAndSet(Number(e.target.value))}
              className={styles.slider}
              style={{
                '--slider-fill': `${maxQty > 0 ? (quantity / maxQty) * 100 : 0}%`,
                '--slider-color': isSell ? 'var(--crt-amber)' : 'var(--crt-green)',
              } as CSSProperties}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
              <span>0</span>
              <span>Max {maxQty}</span>
            </div>
          </div>
          {isSell && selectedDrug && <p className="text-xs text-muted-foreground">Trade profit / loss: {formatCurrency((price - (inventory?.find(s => s.drug === selectedDrug)?.avgBuyPrice ?? price)) * quantity)}</p>}
          {maxQty === 0 && <p className="text-xs text-crt-amber">{isBuy ? 'Not enough cash or coat space for this drug.' : 'Nothing available to sell here.'}</p>}
          {/* Total */}
          <div className="flex justify-between text-xs border-t border-border pt-2">
            <span className="text-muted-foreground">
              {isBuy ? 'Total cost:' : 'Total revenue:'}
            </span>
            <span className={isBuy ? 'text-crt-red font-bold' : 'text-crt-green font-bold'}>
              {formatCurrency(totalCost)}
            </span>
          </div>

          {/* Confirm button */}
          <button
            className={`retro-btn w-full py-2 text-xs font-bold ${isSell ? 'retro-btn-amber' : ''}`}
            disabled={quantity <= 0 || quantity > maxQty}
            onClick={handleConfirm}
          >
            {isBuy ? `Buy ${quantity} ${selectedDrug}` : `Sell ${quantity} ${selectedDrug}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

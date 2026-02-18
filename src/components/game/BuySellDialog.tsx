'use client';

import { useState, useCallback } from 'react';
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

const ADAPTIVE_THRESHOLD = 10;

export function BuySellDialog() {
  const activeModal = useUIStore((s) => s.activeModal);
  const selectedDrug = useUIStore((s) => s.selectedDrug) as DrugName | null;
  const closeModal = useUIStore((s) => s.closeModal);
  const addNotification = useUIStore((s) => s.addNotification);
  const gameState = useGameStore((s) => s.isPro ? s.proGameState : s.gameState);
  const buyDrug = useGameStore((s) => s.buyDrug);
  const sellDrug = useGameStore((s) => s.sellDrug);
  const getMaxBuy = useGameStore((s) => s.getMaxBuy);

  const [quantity, setQuantity] = useState(0);

  const isBuy = activeModal === 'buy';
  const isSell = activeModal === 'sell';
  const isOpen = (isBuy || isSell) && selectedDrug != null;

  const price = selectedDrug && gameState ? (gameState.market[selectedDrug] ?? 0) : 0;
  const owned = selectedDrug
    ? gameState?.inventory.find((s) => s.drug === selectedDrug)?.quantity ?? 0
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
    if (!selectedDrug || quantity <= 0) return;

    if (isBuy) {
      buyDrug(selectedDrug, quantity);
      addNotification(
        `Bought ${quantity} ${selectedDrug} @ ${formatCurrency(price)}`,
        'neutral'
      );
    } else {
      const avgBuyPrice = gameState?.inventory.find((s) => s.drug === selectedDrug)?.avgBuyPrice ?? price;
      const pnl = (price - avgBuyPrice) * quantity;
      sellDrug(selectedDrug, quantity);
      const sign = pnl >= 0 ? '+' : '-';
      const colorType = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'neutral';
      addNotification(
        `Sold ${quantity} ${selectedDrug} · P&L: ${sign}${formatCurrency(Math.abs(pnl))}`,
        colorType
      );
    }

    setQuantity(0);
    closeModal();
  }, [selectedDrug, quantity, isBuy, price, gameState, buyDrug, sellDrug, addNotification, closeModal]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setQuantity(0);
      closeModal();
    }
  }, [closeModal]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="retro-card border-crt-green/30 max-w-sm">
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
              <span className="text-crt-green">{formatCurrency(gameState?.cash ?? 0)}</span>
            </div>
          )}

          {isSell && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">You own:</span>
              <span className="text-crt-cyan">{owned}</span>
            </div>
          )}

          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Max quantity:</span>
            <span className="text-foreground">{maxQty}</span>
          </div>

          {/* Quantity input */}
          <div className="space-y-2">
            {maxQty <= ADAPTIVE_THRESHOLD ? (
              <>
                {/* Stepper: [-] input [+] */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    className="retro-btn text-xs w-8 h-8 flex items-center justify-center"
                    onClick={() => clampAndSet(quantity - 1)}
                    disabled={quantity <= 0}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-16 bg-background border border-[var(--border-strong)] text-center text-xs text-foreground px-2 py-1 inline-flex items-center justify-center">
                    {quantity}
                  </span>
                  <button
                    className="retro-btn text-xs w-8 h-8 flex items-center justify-center"
                    onClick={() => clampAndSet(quantity + 1)}
                    disabled={quantity >= maxQty}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Direct quantity buttons */}
                {maxQty > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setQuantity(n)}
                        className={`retro-btn text-[10px] py-0.5 flex-1 min-w-[28px] ${
                          quantity === n ? 'bg-crt-cyan text-black' : ''
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Slider + number input */}
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={maxQty}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="flex-1 accent-crt-green"
                  />
                  <span className="w-16 bg-background border border-[var(--border-strong)] text-center text-xs text-foreground px-2 py-1 inline-flex items-center justify-center">
                    {quantity}
                  </span>
                </div>

                {/* Quick select buttons */}
                <div className="flex gap-1.5">
                  {[
                    { label: '25%', value: Math.floor(maxQty * 0.25) },
                    { label: '50%', value: Math.floor(maxQty * 0.5) },
                    { label: '75%', value: Math.floor(maxQty * 0.75) },
                    { label: 'Max', value: maxQty },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setQuantity(opt.value)}
                      className="retro-btn text-[10px] px-2 py-0.5 flex-1"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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

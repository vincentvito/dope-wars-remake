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
import { LOAN_SHARK_INTEREST_RATE } from '@/engine/constants';

export function LoanSharkDialog() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const state = useGameStore((s) => s.isPro ? s.proGameState : s.gameState);
  const payLoanShark = useGameStore((s) => s.payLoanShark);

  const [payAmount, setPayAmount] = useState(0);

  const isOpen = activeModal === 'loanShark';
  const cash = state?.cash ?? 0;
  const debt = state?.debt ?? 0;
  const maxPay = Math.min(cash, debt);

  const handlePay = useCallback(() => {
    if (payAmount > 0 && payAmount <= maxPay) {
      payLoanShark(payAmount);
      setPayAmount(0);
    }
  }, [payAmount, maxPay, payLoanShark]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setPayAmount(0);
          closeModal();
        }
      }}
    >
      <DialogContent className="retro-card border-crt-red/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-crt-red text-glow-red">
            Loan Shark
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Debt info */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current debt:</span>
              <span className="text-crt-red text-glow-red font-bold">
                {formatCurrency(debt)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Daily interest:</span>
              <span className="text-crt-amber">
                {(LOAN_SHARK_INTEREST_RATE * 100).toFixed(0)}% ({formatCurrency(Math.floor(debt * LOAN_SHARK_INTEREST_RATE))}/day)
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Your cash:</span>
              <span className="text-crt-green">{formatCurrency(cash)}</span>
            </div>
          </div>

          {debt > 0 ? (
            <div className="space-y-2 border border-border p-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pay back debt</span>
                <span className="text-crt-red">{formatCurrency(payAmount)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={maxPay}
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full accent-crt-red"
              />
              <div className="flex gap-2">
                <button
                  className="retro-btn text-[10px] px-2 flex-1"
                  onClick={() => setPayAmount(maxPay)}
                >
                  Max
                </button>
                <button
                  className="retro-btn retro-btn-red text-[10px] px-3 flex-1"
                  disabled={payAmount <= 0 || payAmount > maxPay}
                  onClick={handlePay}
                >
                  Pay
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-crt-green text-glow-green py-2">
              You are debt-free!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

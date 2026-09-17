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

export function BankDialog() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const state = useGameStore((s) => s.isPro ? s.proGameState : s.gameState);
  const depositToBank = useGameStore((s) => s.depositToBank);
  const withdrawFromBank = useGameStore((s) => s.withdrawFromBank);

  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  const isOpen = activeModal === 'bank';
  const cash = state?.cash ?? 0;
  const bank = state?.bank ?? 0;

  const handleDeposit = useCallback(() => {
    if (depositAmount > 0 && depositAmount <= cash) {
      depositToBank(depositAmount);
      setDepositAmount(0);
    }
  }, [depositAmount, cash, depositToBank]);

  const handleWithdraw = useCallback(() => {
    if (withdrawAmount > 0 && withdrawAmount <= bank) {
      withdrawFromBank(withdrawAmount);
      setWithdrawAmount(0);
    }
  }, [withdrawAmount, bank, withdrawFromBank]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setDepositAmount(0);
          setWithdrawAmount(0);
          closeModal();
        }
      }}
    >
      <DialogContent className="retro-card border-crt-amber/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-pixel text-sm text-crt-amber text-glow-amber">
            Bank
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Bank savings earn 5% interest each time you travel.</p>
          {/* Balances */}
          <div className="flex justify-between text-xs">
            <div>
              <span className="text-muted-foreground">Cash: </span>
              <span className="text-crt-green">{formatCurrency(cash)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Bank: </span>
              <span className="text-crt-amber">{formatCurrency(bank)}</span>
            </div>
          </div>

          {/* Deposit */}
          <div className="space-y-2 border border-border p-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Deposit</span>
              <span className="text-crt-amber">{formatCurrency(depositAmount)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={cash}
              aria-label="Deposit amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="w-full accent-crt-amber"
            />
            <label className="block text-xs text-muted-foreground">Exact amount
              <input type="number" inputMode="numeric" aria-label="Exact deposit amount" min={0} max={cash} step={1} value={depositAmount}
                onChange={e => setDepositAmount(Math.max(0, Math.min(cash, Math.floor(Number(e.target.value) || 0))))}
                className="mt-1 w-full border border-border bg-background p-2 text-base text-foreground" />
            </label>
            <div className="flex gap-2">
              <button
                className="retro-btn text-[10px] px-2 flex-1"
                onClick={() => setDepositAmount(cash)}
              >
                Max
              </button>
              <button
                className="retro-btn retro-btn-amber text-[10px] px-3 flex-1"
                disabled={depositAmount <= 0 || depositAmount > cash}
                onClick={handleDeposit}
              >
                Deposit
              </button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="space-y-2 border border-border p-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Withdraw</span>
              <span className="text-crt-amber">{formatCurrency(withdrawAmount)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={bank}
              aria-label="Withdrawal amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              className="w-full accent-crt-amber"
            />
            <label className="block text-xs text-muted-foreground">Exact amount
              <input type="number" inputMode="numeric" aria-label="Exact withdrawal amount" min={0} max={bank} step={1} value={withdrawAmount}
                onChange={e => setWithdrawAmount(Math.max(0, Math.min(bank, Math.floor(Number(e.target.value) || 0))))}
                className="mt-1 w-full border border-border bg-background p-2 text-base text-foreground" />
            </label>
            <div className="flex gap-2">
              <button
                className="retro-btn text-[10px] px-2 flex-1"
                onClick={() => setWithdrawAmount(bank)}
              >
                Max
              </button>
              <button
                className="retro-btn text-[10px] px-3 flex-1"
                disabled={withdrawAmount <= 0 || withdrawAmount > bank}
                onClick={handleWithdraw}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

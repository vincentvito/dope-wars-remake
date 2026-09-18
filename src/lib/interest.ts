import { BANK_INTEREST_RATE, LOAN_SHARK_INTEREST_RATE } from '@/engine/constants';
export function projectInterest(initial: number, trips: number, kind: 'bank' | 'debt'): number {
  const rate = kind === 'bank' ? BANK_INTEREST_RATE : LOAN_SHARK_INTEREST_RATE;
  let balance = Math.max(0, Math.min(1000000000, Math.floor(Number.isFinite(initial) ? initial : 0)));
  const count = Math.max(0, Math.min(30, Math.floor(Number.isFinite(trips) ? trips : 0)));
  for (let i = 0; i < count; i++) balance += Math.floor(balance * rate);
  return balance;
}

'use client';
import { useState } from 'react';
import { projectInterest } from '@/lib/interest';
export function InterestCalculator() {
  const [debt, setDebt] = useState(5000);
  const [bank, setBank] = useState(2000);
  const [trips, setTrips] = useState(10);
  const money = (value: number) => `$${value.toLocaleString('en-US')}`;
  const field = 'block w-full bg-black border border-crt-green/40 rounded px-3 py-2 mt-2';
  return <div className="border border-crt-green/30 p-5 space-y-5">
    <div className="grid sm:grid-cols-3 gap-5">
      <label>Starting debt ($)<input type="number" min={0} max={1000000000} step={1} className={field} value={debt} onChange={e => setDebt(Number(e.target.value))} /></label>
      <label>Starting bank ($)<input type="number" min={0} max={1000000000} step={1} className={field} value={bank} onChange={e => setBank(Number(e.target.value))} /></label>
      <label>Trips (0–30)<input type="number" min={0} max={30} step={1} className={field} value={trips} onChange={e => setTrips(Number(e.target.value))} /></label>
    </div>
    <p role="status" aria-live="polite">After {Math.max(0, Math.min(30, Math.floor(trips)))} trips: <strong>{money(projectInterest(debt, trips, 'debt'))} debt</strong> and <strong>{money(projectInterest(bank, trips, 'bank'))} bank balance</strong>.</p>
    <p className="text-sm">Balances are clamped to $0–$1 billion, and trips to 0–30 whole trips. This tool does not change your saved game.</p>
  </div>;
}

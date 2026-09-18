'use client';

import { track } from '@vercel/analytics';
import { classifyAcquisition, sanitizeAcquisition, type Acquisition } from './acquisition';

const SESSION_KEY = 'dope-wars-acquisition-v1';
const RUN_KEY = 'dope-wars-measured-run-v1';
const SESSION_TTL = 30 * 60 * 1000;
let enabled = false;
let session: { at: number; acquisition: Acquisition } | null = null;
let run: { seed: string; events: string[] } | null = null;
export function configureAnalytics(value: boolean) { enabled = value; }
export function getAcquisition(): Acquisition {
  if (typeof window === 'undefined') return sanitizeAcquisition(null);
  if (!session) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (saved && Number.isFinite(saved.at) && Date.now() - saved.at < SESSION_TTL) session = { at: saved.at, acquisition: sanitizeAcquisition(saved.acquisition) };
    } catch { /* Storage is optional. */ }
  }
  if (!session || Date.now() - session.at >= SESSION_TTL) {
    session = { at: Date.now(), acquisition: classifyAcquisition(document.referrer, location.pathname, location.origin) };
  }
  session.at = Date.now();
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* Memory fallback. */ }
  return session.acquisition;
}
export function trackFunnel(name: 'game_start' | 'first_trade' | 'game_complete' | 'score_submitted' | 'checkout_started', properties: { mode?: string; returning?: boolean; outcome?: string } = {}) {
  if (!enabled || typeof window === 'undefined') return;
  try { track(`${name}_${properties.mode?.startsWith('pro_') ? 'pro' : properties.mode === '30' ? 'classic' : 'all'}`, getAcquisition()); } catch { /* Measurement must never interrupt play. */ }
}
export function trackRunEvent(name: 'game_start' | 'first_trade' | 'game_complete' | 'score_submitted', seed: string, properties: { mode: string; returning?: boolean; outcome?: string }) {
  if (!enabled || typeof window === 'undefined') return;
  if (!run) {
    try {
      const saved = JSON.parse(localStorage.getItem(RUN_KEY) || 'null');
      if (saved && typeof saved.seed === 'string' && Array.isArray(saved.events)) run = saved;
    } catch { /* Memory fallback. */ }
  }
  if (!run || run.seed !== seed) run = { seed, events: [] };
  if (run.events.includes(name)) return;
  run.events.push(name);
  try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch { /* Keep playing. */ }
  // The seed stays on this device. Never send identities, action logs, or exact scores.
  trackFunnel(name, properties);
}

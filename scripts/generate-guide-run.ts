/** Reproducible demonstration; decisions use the current visible market only. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { applyAction, createNewGame, calculateNetWorth, getUsedInventorySpace } from '../src/engine/game';
import { serializeGame, restoreGame } from '../src/engine/saved-game';
import { CHOICE_EVENTS } from '../src/engine/validation';
import { DRUGS } from '../src/engine/constants';
import type { PlayerAction } from '../src/engine/types';

const seed = 'play-dope-wars-guide-2026-09-18';
let state = createNewGame(seed, '30');
const rows: { day: number; district: string; decision: string; cash: number; bank: number; debt: number; health: number; netWorth: number }[] = [];
const checkpoints: Record<string, string> = { opening: serializeGame(state) };
function act(action: PlayerAction, decision: string) {
  state = applyAction(state, action);
  rows.push({ day: state.currentDay, district: state.currentDistrict, decision, cash: state.cash, bank: state.bank, debt: state.debt, health: state.health, netWorth: calculateNetWorth(state) });
}
let guard = 0;
while (state.phase !== 'game_over' && guard++ < 500) {
  if (state.phase === 'combat') { act({ type: 'COMBAT_RUN' }, 'Attempt to run from combat'); continue; }
  if (state.phase === 'event') { const optional = CHOICE_EVENTS.has(state.activeEvent!.type); act({ type: optional ? 'EVENT_DECLINE' : 'EVENT_ACCEPT' }, optional ? 'Decline optional offer' : `Acknowledge ${state.activeEvent!.type}`); continue; }
  if (state.phase !== 'market') throw Error(`Unexpected phase ${state.phase}`);
  for (const slot of [...state.inventory]) {
    const quote = state.market[slot.drug];
    if (quote && (quote >= slot.avgBuyPrice * 1.25 || state.currentDay === 30)) act({ type: 'SELL', drug: slot.drug, quantity: slot.quantity }, `Sell ${slot.quantity} ${slot.drug} at $${quote} per unit`);
  }
  const payment = Math.min(state.debt, Math.max(0, state.cash - 2000));
  if (payment) act({ type: 'PAY_DEBT', amount: payment }, `Repay $${payment}; keep $2,000 working cash`);
  if (!state.debt && state.cash > 10000) act({ type: 'BANK_DEPOSIT', amount: state.cash - 10000 }, 'Bank cash above a $10,000 trading reserve');
  if (state.currentDay < 30) {
    const options = DRUGS.filter(d => state.market[d.name] && state.market[d.name]! <= (d.minPrice + d.maxPrice) / 2 * 0.75)
      .sort((a, b) => state.market[a.name]! / ((a.minPrice + a.maxPrice) / 2) - state.market[b.name]! / ((b.minPrice + b.maxPrice) / 2));
    const d = options[0];
    if (d) {
      const price = state.market[d.name]!;
      const quantity = Math.min(state.trenchcoatSpace - getUsedInventorySpace(state), Math.floor(state.cash * 0.8 / price));
      if (quantity > 0) act({ type: 'BUY', drug: d.name, quantity }, `Buy ${quantity} ${d.name} at $${price}; quote below 75% of normal midpoint`);
    }
  }
  if ([1, 10, 20, 30].includes(state.currentDay)) checkpoints[`day${state.currentDay}`] = serializeGame(state);
  act({ type: 'TRAVEL', destination: state.currentDistrict === 'Manhattan' ? 'Central Park' : 'Manhattan' }, 'Travel between lower-risk districts; interest accrues');
}
if (state.phase !== 'game_over') throw Error('Demonstration did not finish');
const replay = restoreGame(serializeGame(state));
if (JSON.stringify(replay) !== JSON.stringify(state)) throw Error('Replay differs');
const result = { generated: '2026-09-18', seed, gameMode: '30', policy: 'Current quotes only; sell at 25% gain or on day 30; buy the deepest discount below 75% of normal midpoint with up to 80% cash; keep $2,000 when repaying debt; bank above $10,000 after debt repayment; travel Manhattan/Central Park; decline offers; run from combat. No lookahead or seed selection.', outcome: state.health <= 0 ? 'Died in combat' : 'Time limit reached', day: state.currentDay, netWorth: calculateNetWorth(state), cash: state.cash, bank: state.bank, debt: state.debt, health: state.health, actions: state.actionLog, rows };
mkdirSync('public/press', { recursive: true });
writeFileSync('public/press/recorded-classic-run.json', JSON.stringify(result, null, 2) + '\n');
writeFileSync('src/lib/guide-run.json', JSON.stringify({ ...result, actions: undefined, rows: rows.filter((_, i) => i < 5 || i >= rows.length - 5 || (rows[i].decision.startsWith('Repay') && rows[i].debt === 0)) }, null, 2) + '\n');
writeFileSync('/tmp/dope-guide-checkpoints.json', JSON.stringify(checkpoints));
console.log(JSON.stringify({ outcome: result.outcome, day: result.day, netWorth: result.netWorth, actions: result.actions.length, checkpoints: Object.keys(checkpoints) }));

// Deterministic, legal action logs for browser regression scenarios.
import { writeFileSync } from 'node:fs';
import { createNewGame, applyAction } from '../src/engine/game';
import { createProGame, applyProAction } from '../src/engine/pro-game';
import { generateProMarketPrices } from '../src/engine/pro-market';
import { DISTRICT_NAMES } from '../src/engine/constants';
import type { DrugName } from '../src/engine/types';
import { serializeGame } from '../src/engine/saved-game';
import type { GameState, ProGameState, PlayerAction, ProPlayerAction } from '../src/engine/types';
const fixtures: Record<string, string> = {};
for (const mode of ['30', 'pro_30'] as const) {
  for (let seed = 0; seed < 300; seed++) {
    let state: GameState | ProGameState = mode === '30' ? createNewGame(`browser-${seed}`) : createProGame(`browser-${seed}`, mode);
    fixtures[mode === '30' ? 'classic' : 'pro'] ??= serializeGame(state);
    const step = (action: ProPlayerAction) => { state = mode === '30' ? applyAction(state as GameState, action as PlayerAction) : applyProAction(state as ProGameState, action); };
    // Bank funds before traveling to exercise guaranteed 5% interest and preserve cash.
    step({ type: 'BANK_DEPOSIT', amount: 1000 });
    for (let turn = 0; turn < 200 && state.phase !== 'game_over'; turn++) {
      const prefix = mode === '30' ? '' : 'pro-';
      if (state.phase === 'event') {
        fixtures[prefix+'event'] ??= serializeGame(state);
        step({ type: 'EVENT_ACCEPT' });
      } else if (state.phase === 'combat') {
        fixtures[prefix+'combat'] ??= serializeGame(state);
        if (mode !== '30' && (state as ProGameState).armory.length) fixtures['pro-armed-combat'] ??= serializeGame(state);
        step({ type: 'COMBAT_RUN' });
      } else {
        if (state.currentDay === 30) fixtures[prefix+'last-day'] ??= serializeGame(state);
        step({ type: 'TRAVEL', destination: state.currentDistrict === 'Bronx' ? 'Manhattan' : 'Bronx' });
      }
    }
    if (fixtures[(mode === '30' ? '' : 'pro-')+'last-day'] && (mode === '30' || fixtures['pro-armed-combat'])) break;
  }
}
// Build an asset/lab scenario through legal trades, rather than injecting balances.
for (let seed = 0; seed < 100 && !fixtures['pro-assets']; seed++) {
  let state = createProGame(`browser-assets-${seed}`, 'pro_30');
  for (let step = 0; step < 200 && state.phase !== 'game_over'; step++) {
    if (state.phase === 'combat') { state = applyProAction(state, { type: 'COMBAT_RUN' }); continue; }
    if (state.phase === 'event') { state = applyProAction(state, { type: 'EVENT_ACCEPT' }); continue; }
    for (const slot of [...state.inventory]) if (state.market[slot.drug]) state = applyProAction(state, { type: 'SELL', drug: slot.drug, quantity: slot.quantity });
    if (state.cash > 150000 && state.market.Speed && state.currentDay < 29) {
      state = applyProAction(state, { type: 'BUY_ASSET', assetType: 'Lab' });
      state = applyProAction(state, { type: 'BUY_ASSET', assetType: 'Van' });
      state = applyProAction(state, { type: 'BUY', drug: 'Speed', quantity: 10 });
      fixtures['pro-assets'] = serializeGame(state);
      fixtures['pro-lab-pending'] = serializeGame(applyProAction(state, { type: 'CUT_DRUGS', drug: 'Speed', cutPercentage: 25 }));
      break;
    }
    let best = { profit: -Infinity, drug: null as DrugName | null, quantity: 0, destination: DISTRICT_NAMES.find(d => d !== state.currentDistrict)! };
    for (const destination of DISTRICT_NAMES.filter(d => d !== state.currentDistrict)) {
      const prices = generateProMarketPrices(state.seed, state.currentDay + 1, destination).prices;
      for (const [name, price] of Object.entries(state.market)) {
        const drug = name as DrugName;
        const quantity = Math.min(Math.floor(state.cash / price!), state.trenchcoatSpace - state.inventory.reduce((sum, slot) => sum + slot.quantity, 0));
        const profit = ((prices[drug] ?? price!) - price!) * quantity;
        if (profit > best.profit) best = { profit, drug, quantity, destination };
      }
    }
    if (best.profit > 0 && best.drug && best.quantity > 0) state = applyProAction(state, { type: 'BUY', drug: best.drug, quantity: best.quantity });
    state = applyProAction(state, { type: 'TRAVEL', destination: best.destination });
  }
}
writeFileSync(process.env.GAME_FIXTURES_PATH ?? '/tmp/dope-fixtures.json', JSON.stringify(fixtures, null, 2));
console.log(Object.keys(fixtures));

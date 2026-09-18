'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  GameState, PlayerAction, DrugName, DistrictName, GameMode,
  ProGameState, ProPlayerAction, LocationName, AssetType,
} from '@/engine/types';
import { createNewGame, applyAction, calculateNetWorth, getUsedInventorySpace } from '@/engine/game';
import { createProGame, applyProAction, calculateProNetWorth, isProMode } from '@/engine/pro-game';
import { getMaxBuyQuantity } from '@/engine/inventory';
import { getAvailableDestinations, getEffectiveTravelCost, canTravelTo } from '@/engine/cities';
import { restoreGame, serializeGame, SAVE_KEY } from '@/engine/saved-game';
import { trackRunEvent } from '@/lib/analytics';
import { useUIStore } from '@/stores/ui-store';


interface GameStore {
  hydrated: boolean;
  saveError: string | null;
  hydrate: () => void;
  saveProgress: () => void;
  // State
  gameState: GameState | null;
  proGameState: ProGameState | null;
  isPlaying: boolean;
  netWorth: number;
  isPro: boolean;

  // Actions
  startNewGame: (gameMode?: GameMode) => void;
  dispatch: (action: PlayerAction) => boolean;
  dispatchPro: (action: ProPlayerAction) => boolean;

  // Classic convenience actions
  buyDrug: (drug: DrugName, quantity: number) => boolean;
  sellDrug: (drug: DrugName, quantity: number) => boolean;
  travel: (destination: DistrictName) => boolean;
  depositToBank: (amount: number) => boolean;
  withdrawFromBank: (amount: number) => boolean;
  payLoanShark: (amount: number) => boolean;
  fight: () => boolean;
  run: () => boolean;
  acceptEvent: () => boolean;
  declineEvent: () => boolean;

  // Pro convenience actions
  travelPro: (destination: LocationName) => boolean;
  buyAsset: (assetType: AssetType) => boolean;
  cutDrugs: (drug: DrugName, cutPercentage: number) => boolean;
  confirmLab: () => boolean;
  cancelLab: () => boolean;
  selectLoadout: (weaponIndices: number[]) => boolean;
  discardWeapon: (weaponIndex: number) => boolean;

  // Derived helpers
  getMaxBuy: (drug: DrugName) => number;
  getUsedSpace: () => number;
  getAvailableSpace: () => number;

  // Pro derived helpers
  getProAvailableDestinations: () => LocationName[];
  getProTravelCost: (destination: LocationName) => number;
  canTravelToPro: (destination: LocationName) => boolean;
}

const storeImpl: import('zustand').StateCreator<GameStore> = (set, get) => ({
      hydrated: false,
      saveError: null,
      hydrate: () => {
        if (get().hydrated) return;
        try {
          const saved = localStorage.getItem(SAVE_KEY);
          if (saved && !get().gameState && !get().proGameState) {
            const state = restoreGame(saved);
            const pro = isProMode(state.gameMode);
            set({ gameState: pro ? null : state as GameState, proGameState: pro ? state as ProGameState : null,
              isPro: pro, isPlaying: state.phase !== 'game_over',
              netWorth: pro ? calculateProNetWorth(state as ProGameState) : calculateNetWorth(state as GameState) });
          }
        } catch {
          set({ saveError: 'Saved progress could not be loaded. You can start a new game.' });
        }
        set({ hydrated: true });
      },
      saveProgress: () => {
        const state = get().isPro ? get().proGameState : get().gameState;
        if (!state) return;
        try {
          localStorage.setItem(SAVE_KEY, serializeGame(state));
          set({ saveError: null });
        } catch {
          set({ saveError: 'Progress could not be saved on this device. Keep this tab open to continue.' });
        }
      },
      gameState: null,
      proGameState: null,
      isPlaying: false,
      netWorth: 0,
      isPro: false,

      startNewGame: (gameMode: GameMode = '30') => {
        const returning = Boolean(get().gameState || get().proGameState);
        useUIStore.setState({ activeModal: null, selectedDrug: null, settingsOpen: false, activeProTab: 'market', notifications: [] });
        const seed = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        if (isProMode(gameMode)) {
          const state = createProGame(seed, gameMode);
          set({
            gameState: null,
            proGameState: state,
            isPlaying: true,
            netWorth: calculateProNetWorth(state),
            isPro: true,
          });
        } else {
          const state = createNewGame(seed, gameMode);
          set({
            gameState: state,
            proGameState: null,
            isPlaying: true,
            netWorth: calculateNetWorth(state),
            isPro: false,
          });
        }
        get().saveProgress();
        trackRunEvent('game_start', seed, { mode: gameMode, returning });
      },

      dispatch: (action: PlayerAction) => {
        const { gameState } = get();
        if (!gameState) return false;

        try {
          const newState = applyAction(gameState, action);
          if ((action.type === 'BUY' || action.type === 'SELL') && !gameState.actionLog.some(a => a.type === 'BUY' || a.type === 'SELL')) trackRunEvent('first_trade', gameState.seed, { mode: gameState.gameMode });
          if (newState.phase === 'game_over' && gameState.phase !== 'game_over') trackRunEvent('game_complete', gameState.seed, { mode: gameState.gameMode, outcome: newState.health <= 0 ? 'death' : 'time_limit' });
          set({
            gameState: newState,
            isPlaying: newState.phase !== 'game_over',
            netWorth: calculateNetWorth(newState),
          });
          get().saveProgress();
          return true;
        } catch (error) {
          useUIStore.getState().addNotification(error instanceof Error ? error.message : 'Action failed. Please try again.', 'loss');
          return false;
        }
      },

      dispatchPro: (action: ProPlayerAction) => {
        const { proGameState } = get();
        if (!proGameState) return false;

        try {
          const newState = applyProAction(proGameState, action);
          if ((action.type === 'BUY' || action.type === 'SELL') && !proGameState.actionLog.some(a => a.type === 'BUY' || a.type === 'SELL')) trackRunEvent('first_trade', proGameState.seed, { mode: proGameState.gameMode });
          if (newState.phase === 'game_over' && proGameState.phase !== 'game_over') trackRunEvent('game_complete', proGameState.seed, { mode: proGameState.gameMode, outcome: newState.health <= 0 ? 'death' : 'time_limit' });
          set({
            proGameState: newState,
            isPlaying: newState.phase !== 'game_over',
            netWorth: calculateProNetWorth(newState),
          });
          get().saveProgress();
          return true;
        } catch (error) {
          useUIStore.getState().addNotification(error instanceof Error ? error.message : 'Action failed. Please try again.', 'loss');
          return false;
        }
      },

      // Classic convenience actions
      buyDrug: (drug, quantity) => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'BUY', drug, quantity });
        } else {
          return get().dispatch({ type: 'BUY', drug, quantity });
        }
      },
      sellDrug: (drug, quantity) => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'SELL', drug, quantity });
        } else {
          return get().dispatch({ type: 'SELL', drug, quantity });
        }
      },
      travel: (destination) => {
        return get().dispatch({ type: 'TRAVEL', destination });
      },
      depositToBank: (amount) => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'BANK_DEPOSIT', amount });
        } else {
          return get().dispatch({ type: 'BANK_DEPOSIT', amount });
        }
      },
      withdrawFromBank: (amount) => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'BANK_WITHDRAW', amount });
        } else {
          return get().dispatch({ type: 'BANK_WITHDRAW', amount });
        }
      },
      payLoanShark: (amount) => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'PAY_DEBT', amount });
        } else {
          return get().dispatch({ type: 'PAY_DEBT', amount });
        }
      },
      fight: () => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'COMBAT_FIGHT' });
        } else {
          return get().dispatch({ type: 'COMBAT_FIGHT' });
        }
      },
      run: () => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'COMBAT_RUN' });
        } else {
          return get().dispatch({ type: 'COMBAT_RUN' });
        }
      },
      acceptEvent: () => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'EVENT_ACCEPT' });
        } else {
          return get().dispatch({ type: 'EVENT_ACCEPT' });
        }
      },
      declineEvent: () => {
        const { isPro } = get();
        if (isPro) {
          return get().dispatchPro({ type: 'EVENT_DECLINE' });
        } else {
          return get().dispatch({ type: 'EVENT_DECLINE' });
        }
      },

      // Pro convenience actions
      travelPro: (destination) => {
        const success = get().dispatchPro({ type: 'TRAVEL', destination });
        if (success) useUIStore.getState().setActiveProTab('market');
        return success;
      },
      buyAsset: (assetType) => get().dispatchPro({ type: 'BUY_ASSET', assetType }),
      cutDrugs: (drug, cutPercentage) => get().dispatchPro({ type: 'CUT_DRUGS', drug, cutPercentage }),
      confirmLab: () => get().dispatchPro({ type: 'LAB_CONFIRM' }),
      cancelLab: () => get().dispatchPro({ type: 'LAB_CANCEL' }),
      selectLoadout: (weaponIndices) => get().dispatchPro({ type: 'SELECT_LOADOUT', weaponIndices }),
      discardWeapon: (weaponIndex) => get().dispatchPro({ type: 'DISCARD_WEAPON', weaponIndex }),

      // Derived helpers
      getMaxBuy: (drug: DrugName) => {
        const { gameState, proGameState, isPro } = get();
        const state = isPro ? proGameState : gameState;
        if (!state) return 0;
        // getMaxBuyQuantity uses only shared fields
        return getMaxBuyQuantity(state as GameState, drug);
      },

      getUsedSpace: () => {
        const { gameState, proGameState, isPro } = get();
        const state = isPro ? proGameState : gameState;
        if (!state) return 0;
        return getUsedInventorySpace(state as GameState);
      },

      getAvailableSpace: () => {
        const { gameState, proGameState, isPro } = get();
        const state = isPro ? proGameState : gameState;
        if (!state) return 0;
        return state.trenchcoatSpace - getUsedInventorySpace(state as GameState);
      },

      // Pro derived helpers
      getProAvailableDestinations: () => {
        const { proGameState } = get();
        if (!proGameState) return [];
        return getAvailableDestinations(proGameState);
      },

      getProTravelCost: (destination: LocationName) => {
        const { proGameState } = get();
        if (!proGameState) return 0;
        return getEffectiveTravelCost(proGameState, destination);
      },

      canTravelToPro: (destination: LocationName) => {
        const { proGameState } = get();
        if (!proGameState) return false;
        return canTravelTo(proGameState, destination);
      },
});

export const useGameStore = create<GameStore>()(
  process.env.NODE_ENV === 'development'
    ? devtools(storeImpl, { name: 'dope-wars-game' })
    : storeImpl as import('zustand').StateCreator<GameStore, [], [["zustand/devtools", never]]>
);

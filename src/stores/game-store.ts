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
import { useUIStore } from '@/stores/ui-store';


interface GameStore {
  // State
  gameState: GameState | null;
  proGameState: ProGameState | null;
  isPlaying: boolean;
  netWorth: number;
  isPro: boolean;

  // Actions
  startNewGame: (gameMode?: GameMode) => void;
  dispatch: (action: PlayerAction) => void;
  dispatchPro: (action: ProPlayerAction) => void;

  // Classic convenience actions
  buyDrug: (drug: DrugName, quantity: number) => void;
  sellDrug: (drug: DrugName, quantity: number) => void;
  travel: (destination: DistrictName) => void;
  depositToBank: (amount: number) => void;
  withdrawFromBank: (amount: number) => void;
  payLoanShark: (amount: number) => void;
  fight: () => void;
  run: () => void;
  acceptEvent: () => void;
  declineEvent: () => void;

  // Pro convenience actions
  travelPro: (destination: LocationName) => void;
  buyAsset: (assetType: AssetType) => void;
  cutDrugs: (drug: DrugName, cutPercentage: number) => void;
  confirmLab: () => void;
  cancelLab: () => void;
  selectLoadout: (weaponIndices: number[]) => void;
  discardWeapon: (weaponIndex: number) => void;

  // Derived helpers
  getMaxBuy: (drug: DrugName) => number;
  getUsedSpace: () => number;
  getAvailableSpace: () => number;

  // Pro derived helpers
  getProAvailableDestinations: () => LocationName[];
  getProTravelCost: (destination: LocationName) => number;
  canTravelToPro: (destination: LocationName) => boolean;
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      gameState: null,
      proGameState: null,
      isPlaying: false,
      netWorth: 0,
      isPro: false,

      startNewGame: (gameMode: GameMode = '30') => {
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
      },

      dispatch: (action: PlayerAction) => {
        const { gameState } = get();
        if (!gameState) return;

        try {
          const newState = applyAction(gameState, action);
          set({
            gameState: newState,
            isPlaying: newState.phase !== 'game_over',
            netWorth: calculateNetWorth(newState),
          });
        } catch (error) {
          console.error('Invalid action:', error);
        }
      },

      dispatchPro: (action: ProPlayerAction) => {
        const { proGameState } = get();
        if (!proGameState) return;

        try {
          const newState = applyProAction(proGameState, action);
          set({
            proGameState: newState,
            isPlaying: newState.phase !== 'game_over',
            netWorth: calculateProNetWorth(newState),
          });
        } catch (error) {
          console.error('Invalid pro action:', error);
        }
      },

      // Classic convenience actions
      buyDrug: (drug, quantity) => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'BUY', drug, quantity });
        } else {
          get().dispatch({ type: 'BUY', drug, quantity });
        }
      },
      sellDrug: (drug, quantity) => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'SELL', drug, quantity });
        } else {
          get().dispatch({ type: 'SELL', drug, quantity });
        }
      },
      travel: (destination) => {
        get().dispatch({ type: 'TRAVEL', destination });
      },
      depositToBank: (amount) => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'BANK_DEPOSIT', amount });
        } else {
          get().dispatch({ type: 'BANK_DEPOSIT', amount });
        }
      },
      withdrawFromBank: (amount) => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'BANK_WITHDRAW', amount });
        } else {
          get().dispatch({ type: 'BANK_WITHDRAW', amount });
        }
      },
      payLoanShark: (amount) => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'PAY_DEBT', amount });
        } else {
          get().dispatch({ type: 'PAY_DEBT', amount });
        }
      },
      fight: () => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'COMBAT_FIGHT' });
        } else {
          get().dispatch({ type: 'COMBAT_FIGHT' });
        }
      },
      run: () => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'COMBAT_RUN' });
        } else {
          get().dispatch({ type: 'COMBAT_RUN' });
        }
      },
      acceptEvent: () => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'EVENT_ACCEPT' });
        } else {
          get().dispatch({ type: 'EVENT_ACCEPT' });
        }
      },
      declineEvent: () => {
        const { isPro } = get();
        if (isPro) {
          get().dispatchPro({ type: 'EVENT_DECLINE' });
        } else {
          get().dispatch({ type: 'EVENT_DECLINE' });
        }
      },

      // Pro convenience actions
      travelPro: (destination) => {
        get().dispatchPro({ type: 'TRAVEL', destination });
        useUIStore.getState().setActiveProTab('market');
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
    }),
    { name: 'dope-wars-game' }
  )
);

import type { ProGameState, AssetType } from './types';
import { ASSET_MAP } from './pro-constants';

/**
 * Buy an asset.
 */
export function buyAsset(state: ProGameState, assetType: AssetType): ProGameState {
  const definition = ASSET_MAP[assetType];

  if (state.assets.some((a) => a.type === assetType)) {
    throw new Error(`Already own ${assetType}`);
  }

  if (state.cash < definition.cost) {
    throw new Error(`Not enough cash to buy ${assetType} (need $${definition.cost})`);
  }

  return {
    ...state,
    cash: state.cash - definition.cost,
    assets: [...state.assets, { type: assetType, purchasedDay: state.currentDay }],
    trenchcoatSpace: state.trenchcoatSpace + definition.stashBonus,
  };
}

/**
 * Check if the player owns an asset.
 */
export function hasAsset(state: ProGameState, assetType: AssetType): boolean {
  return state.assets.some((a) => a.type === assetType);
}


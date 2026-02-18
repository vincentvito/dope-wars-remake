import type { GameState, DrugName } from './types';

/**
 * Calculate the total used inventory space.
 */
export function getUsedSpace(state: GameState): number {
  return state.inventory.reduce((sum, slot) => sum + slot.quantity, 0);
}

/**
 * Calculate max quantity the player can buy of a drug.
 */
export function getMaxBuyQuantity(state: GameState, drug: DrugName): number {
  const price = state.market[drug];
  if (price == null || price <= 0) return 0;

  const affordableQty = Math.floor(state.cash / price);
  const availableSpace = state.trenchcoatSpace - getUsedSpace(state);

  return Math.max(0, Math.min(affordableQty, availableSpace));
}

/**
 * Execute a drug purchase.
 */
export function executeBuy(
  state: GameState,
  drug: DrugName,
  quantity: number
): GameState {
  const price = state.market[drug];
  if (price == null) {
    throw new Error(`${drug} is not available at this market`);
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }

  const totalCost = price * quantity;
  if (totalCost > state.cash) {
    throw new Error(`Not enough cash. Need $${totalCost}, have $${state.cash}`);
  }

  const usedSpace = getUsedSpace(state);
  const availableSpace = state.trenchcoatSpace - usedSpace;
  if (quantity > availableSpace) {
    throw new Error(`Not enough space. Need ${quantity}, have ${availableSpace}`);
  }

  // Update inventory
  const existing = state.inventory.find((s) => s.drug === drug);
  let newInventory: typeof state.inventory;

  if (existing) {
    // Update avg buy price with weighted average
    const totalQty = existing.quantity + quantity;
    const newAvgPrice = Math.floor(
      (existing.avgBuyPrice * existing.quantity + price * quantity) / totalQty
    );

    newInventory = state.inventory.map((s) =>
      s.drug === drug
        ? { ...s, quantity: totalQty, avgBuyPrice: newAvgPrice }
        : s
    );
  } else {
    newInventory = [
      ...state.inventory,
      { drug, quantity, avgBuyPrice: price },
    ];
  }

  return {
    ...state,
    cash: state.cash - totalCost,
    inventory: newInventory,
  };
}

/**
 * Execute a drug sale.
 */
export function executeSell(
  state: GameState,
  drug: DrugName,
  quantity: number
): GameState {
  const price = state.market[drug];
  if (price == null) {
    throw new Error(`${drug} is not available at this market`);
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }

  const slot = state.inventory.find((s) => s.drug === drug);
  if (!slot || slot.quantity < quantity) {
    throw new Error(
      `Not enough ${drug}. Have ${slot?.quantity ?? 0}, trying to sell ${quantity}`
    );
  }

  const totalRevenue = price * quantity;
  const remainingQty = slot.quantity - quantity;

  const newInventory = remainingQty > 0
    ? state.inventory.map((s) =>
        s.drug === drug ? { ...s, quantity: remainingQty } : s
      )
    : state.inventory.filter((s) => s.drug !== drug);

  return {
    ...state,
    cash: state.cash + totalRevenue,
    inventory: newInventory,
  };
}

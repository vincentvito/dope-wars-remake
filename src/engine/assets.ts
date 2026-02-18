import type { ProGameState, AssetType, InventorySlot } from './types';
import { ASSET_MAP, PLANTATION_WEED_MIN, PLANTATION_WEED_MAX, PLANTATION_SHROOMS_MIN, PLANTATION_SHROOMS_MAX, PLANTATION_BUFFER_MAX } from './pro-constants';
import { SeededRNG } from './rng';

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

/**
 * Process plantation: flush buffer to inventory, then produce new drugs.
 */
export function processPlantation(state: ProGameState): ProGameState {
  if (!hasAsset(state, 'Plantation')) return state;

  let newState = { ...state };

  // Step 1: Flush buffer to inventory (if space)
  newState = flushPlantationBuffer(newState);

  // Step 2: Produce new drugs
  const rng = new SeededRNG(`${state.seed}-plantation-day${state.currentDay}`);
  const weedQty = rng.nextInt(PLANTATION_WEED_MIN, PLANTATION_WEED_MAX);
  const shroomQty = rng.nextInt(PLANTATION_SHROOMS_MIN, PLANTATION_SHROOMS_MAX);

  newState = addPlantationDrugs(newState, 'Weed', weedQty);
  newState = addPlantationDrugs(newState, 'Shrooms', shroomQty);

  return newState;
}

/**
 * Flush plantation buffer to inventory where space allows.
 */
function flushPlantationBuffer(state: ProGameState): ProGameState {
  if (state.plantationBuffer.length === 0) return state;

  let inventory = [...state.inventory];
  let buffer: InventorySlot[] = [];
  const usedSpace = inventory.reduce((sum, s) => sum + s.quantity, 0);
  let availableSpace = state.trenchcoatSpace - usedSpace;

  for (const slot of state.plantationBuffer) {
    if (availableSpace <= 0) {
      buffer.push(slot);
      continue;
    }

    const transferQty = Math.min(slot.quantity, availableSpace);
    if (transferQty <= 0) {
      buffer.push(slot);
      continue;
    }

    // Add to inventory
    inventory = addDrugToInventory(inventory, slot.drug, transferQty);
    availableSpace -= transferQty;

    // Keep remainder in buffer
    const remaining = slot.quantity - transferQty;
    if (remaining > 0) {
      buffer.push({ ...slot, quantity: remaining });
    }
  }

  return { ...state, inventory, plantationBuffer: buffer };
}

/**
 * Add plantation-produced drugs to inventory or buffer.
 */
function addPlantationDrugs(state: ProGameState, drug: 'Weed' | 'Shrooms', quantity: number): ProGameState {
  const usedSpace = state.inventory.reduce((sum, s) => sum + s.quantity, 0);
  const availableSpace = state.trenchcoatSpace - usedSpace;

  if (availableSpace >= quantity) {
    // Enough room in inventory
    return {
      ...state,
      inventory: addDrugToInventory([...state.inventory], drug, quantity),
    };
  }

  // Add what fits to inventory
  let newState = { ...state };
  if (availableSpace > 0) {
    newState = {
      ...newState,
      inventory: addDrugToInventory([...newState.inventory], drug, availableSpace),
    };
  }

  // Put remainder in buffer
  const overflow = quantity - Math.max(0, availableSpace);
  if (overflow > 0) {
    const bufferTotal = newState.plantationBuffer.reduce((sum, s) => sum + s.quantity, 0);
    const bufferRoom = PLANTATION_BUFFER_MAX - bufferTotal;
    const bufferAdd = Math.min(overflow, bufferRoom);

    if (bufferAdd > 0) {
      const existingBufferSlot = newState.plantationBuffer.find((s) => s.drug === drug);
      if (existingBufferSlot) {
        newState = {
          ...newState,
          plantationBuffer: newState.plantationBuffer.map((s) =>
            s.drug === drug ? { ...s, quantity: s.quantity + bufferAdd } : s
          ),
        };
      } else {
        newState = {
          ...newState,
          plantationBuffer: [...newState.plantationBuffer, { drug, quantity: bufferAdd, avgBuyPrice: 0 }],
        };
      }
    }
    // If buffer is also full, production is lost
  }

  return newState;
}

/**
 * Helper: add drug to inventory array (merging with existing slot or creating new).
 */
function addDrugToInventory(inventory: InventorySlot[], drug: string, quantity: number): InventorySlot[] {
  const existing = inventory.find((s) => s.drug === drug);
  if (existing) {
    return inventory.map((s) =>
      s.drug === drug ? { ...s, quantity: s.quantity + quantity } : s
    );
  }
  return [...inventory, { drug: drug as InventorySlot['drug'], quantity, avgBuyPrice: 0 }];
}

'use client';

import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { ASSET_DEFINITIONS } from '@/engine/pro-constants';
import { AssetCard } from './AssetCard';

export function AssetsScreen() {
  const state = useGameStore((s) => s.proGameState);
  const buyAssetAction = useGameStore((s) => s.buyAsset);
  const openModal = useUIStore((s) => s.openModal);

  if (!state) return null;

  const ownedTypes = new Set(state.assets.map((a) => a.type));
  const hasPlantation = ownedTypes.has('Plantation');

  return (
    <div className="space-y-4">
      {/* Header */}
      <span className="font-pixel text-xs text-muted-foreground">
        ASSETS ({state.assets.length}/7)
      </span>

      {/* Asset cards */}
      <div className="space-y-2">
        {ASSET_DEFINITIONS.map((def) => {
          const isOwned = ownedTypes.has(def.type);
          return (
            <AssetCard
              key={def.type}
              definition={def}
              isOwned={isOwned}
              canAfford={state.cash >= def.cost}
              onBuy={() => buyAssetAction(def.type)}
              onClick={def.type === 'Lab' && isOwned ? () => openModal('lab') : undefined}
            />
          );
        })}
      </div>

      {/* Plantation status */}
      {hasPlantation && (
        <div className="retro-card p-3 border-crt-green/30">
          <div className="font-pixel text-xs text-crt-green mb-1">PLANTATION</div>
          <div className="text-[10px] text-muted-foreground">
            Produces 2-5 Weed + 1-3 Shrooms daily. Auto-collected when you have stash space.
          </div>
          {state.plantationBuffer.length > 0 && (
            <div className="mt-2 text-[10px]">
              <span className="text-crt-cyan">Buffer: </span>
              {state.plantationBuffer.map((s) => (
                <span key={s.drug} className="text-foreground mr-2">
                  {s.quantity} {s.drug}
                </span>
              ))}
              <span className="text-muted-foreground">
                ({state.plantationBuffer.reduce((sum, s) => sum + s.quantity, 0)}/50)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

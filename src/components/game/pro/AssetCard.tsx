'use client';

import type { AssetDefinition } from '@/engine/types';
import { formatCurrency } from '@/lib/utils';

interface AssetCardProps {
  definition: AssetDefinition;
  isOwned: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onClick?: () => void;
}

export function AssetCard({ definition, isOwned, canAfford, onBuy, onClick }: AssetCardProps) {
  return (
    <div
      className={`retro-card p-3 ${
        isOwned
          ? 'border-crt-green/30'
          : canAfford
            ? 'border-border'
            : 'border-dashed border-muted-foreground/30 opacity-60'
      } ${isOwned && onClick ? 'cursor-pointer hover:bg-[var(--row-hover)] transition-colors' : ''}`}
      onClick={isOwned && onClick ? onClick : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-foreground">{definition.type}</span>
            {isOwned && <span className="text-crt-green text-[10px]">OWNED</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{definition.description}</div>
          <div className="flex gap-3 mt-1.5 text-[10px]">
            {definition.stashBonus > 0 && (
              <span className="text-crt-cyan">+{definition.stashBonus} stash</span>
            )}
            {!isOwned && (
              <span className="text-crt-amber">{formatCurrency(definition.cost)}</span>
            )}
          </div>
        </div>

        {!isOwned && (
          <button
            className="retro-btn text-[10px] py-1 px-3 ml-2 shrink-0"
            disabled={!canAfford}
            onClick={onBuy}
          >
            BUY
          </button>
        )}
      </div>
    </div>
  );
}

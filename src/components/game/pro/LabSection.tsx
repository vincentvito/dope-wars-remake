'use client';

import { useState } from 'react';
import { useGameStore } from '@/stores/game-store';
import { LAB_CUT_OPTIONS, LAB_CUT_MULTIPLIER, LAB_CUT_BUST_CHANCE, CUTTABLE_DRUGS } from '@/engine/pro-constants';
import type { DrugName } from '@/engine/types';

const RISK_LABELS: Record<number, { text: string; color: string }> = {
  10: { text: 'LOW', color: 'text-crt-green' },
  5: { text: 'MODERATE', color: 'text-crt-amber' },
  3: { text: 'HIGH', color: 'text-crt-red' },
  2: { text: 'EXTREME', color: 'text-crt-red text-glow-red' },
};

export function LabSection() {
  const state = useGameStore((s) => s.proGameState);
  const cutDrugs = useGameStore((s) => s.cutDrugs);
  const [selectedDrug, setSelectedDrug] = useState<DrugName | null>(null);
  const [cutPercent, setCutPercent] = useState<number>(25);

  if (!state) return null;

  const drugsInInventory = state.inventory.filter((s) => s.quantity > 0 && CUTTABLE_DRUGS.has(s.drug));
  const selected = drugsInInventory.find((s) => s.drug === selectedDrug);
  const multiplier = LAB_CUT_MULTIPLIER[cutPercent] ?? 1;
  const bustChance = LAB_CUT_BUST_CHANCE[cutPercent] ?? 10;
  const risk = RISK_LABELS[bustChance] ?? RISK_LABELS[10];

  const handleCut = () => {
    if (selectedDrug) {
      cutDrugs(selectedDrug, cutPercent);
    }
  };

  return (
    <div className="retro-card p-3 border-crt-cyan/30">
      <div className="font-pixel text-xs text-crt-cyan mb-3">DRUG LAB</div>

      {drugsInInventory.length === 0 ? (
        <div className="text-[10px] text-muted-foreground">No drugs in inventory to cut.</div>
      ) : (
        <div className="space-y-3">
          {/* Drug selector */}
          <div className="flex flex-wrap gap-1.5">
            {drugsInInventory.map((slot) => (
              <button
                key={slot.drug}
                onClick={() => setSelectedDrug(slot.drug)}
                className={`retro-btn text-[10px] py-1 px-2 ${
                  selectedDrug === slot.drug ? 'bg-crt-cyan text-black' : ''
                }`}
              >
                {slot.drug} ({slot.quantity})
              </button>
            ))}
          </div>

          {selectedDrug && selected && (
            <>
              {/* Cut percentage */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-muted-foreground">Cut percentage:</div>
                <div className="flex gap-1.5">
                  {LAB_CUT_OPTIONS.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setCutPercent(pct)}
                      className={`retro-btn text-[10px] py-1 px-2 flex-1 ${
                        cutPercent === pct ? 'bg-crt-cyan text-black' : ''
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center justify-between text-[10px]">
                <div>
                  <span className="text-muted-foreground">Yield: </span>
                  <span className="text-crt-green">
                    {selected.quantity} → {Math.floor(selected.quantity * multiplier)} ({multiplier}x)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk: </span>
                  <span className={risk.color}>{risk.text}</span>
                </div>
              </div>

              {/* Cut button */}
              <button
                className="retro-btn w-full py-2 text-xs font-pixel"
                onClick={handleCut}
              >
                CUT DRUGS
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { useUIStore } from '@/stores/ui-store';
import { LAB_CUT_OPTIONS, LAB_CUT_MULTIPLIER, LAB_CUT_BUST_CHANCE, CUTTABLE_DRUGS } from '@/engine/pro-constants';
import type { DrugName } from '@/engine/types';

const RISK_LABELS: Record<number, { text: string; color: string }> = {
  10: { text: 'LOW', color: 'text-crt-green' },
  5: { text: 'MODERATE', color: 'text-crt-amber' },
  3: { text: 'HIGH', color: 'text-crt-red' },
  2: { text: 'EXTREME', color: 'text-crt-red text-glow-red' },
};

export function LabModal() {
  const state = useGameStore((s) => s.proGameState);
  const cutDrugs = useGameStore((s) => s.cutDrugs);
  const confirmLab = useGameStore((s) => s.confirmLab);
  const activeModal = useUIStore((s) => s.activeModal);
  const selectedDrugFromModal = useUIStore((s) => s.selectedDrug) as DrugName | null;
  const closeModal = useUIStore((s) => s.closeModal);

  const [selectedDrug, setSelectedDrug] = useState<DrugName | null>(null);
  const [cutPercent, setCutPercent] = useState<number>(25);

  const isOpen = activeModal === 'lab';

  // Pre-select drug when opened from market CUT button
  useEffect(() => {
    if (isOpen && selectedDrugFromModal) {
      setSelectedDrug(selectedDrugFromModal);
    } else if (!isOpen) {
      setSelectedDrug(null);
      setCutPercent(25);
    }
  }, [isOpen, selectedDrugFromModal]);

  if (!isOpen || !state) return null;

  const drugsInInventory = state.inventory.filter((s) => s.quantity > 0 && CUTTABLE_DRUGS.has(s.drug));
  const selected = drugsInInventory.find((s) => s.drug === selectedDrug);
  const multiplier = LAB_CUT_MULTIPLIER[cutPercent] ?? 1;
  const bustChance = LAB_CUT_BUST_CHANCE[cutPercent] ?? 10;
  const risk = RISK_LABELS[bustChance] ?? RISK_LABELS[10];

  const handleCut = () => {
    if (selectedDrug) {
      cutDrugs(selectedDrug, cutPercent);
      confirmLab();
      closeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-start pt-[10vh] overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-6 gap-4 pb-10">
        {/* Title */}
        <h2 className="font-pixel text-lg text-crt-cyan text-glow-blue">
          DRUG LAB
        </h2>

        {drugsInInventory.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center">
            No drugs in inventory to cut.
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* Drug selector */}
            <div>
              <div className="text-[10px] text-muted-foreground mb-2">Select drug:</div>
              <div className="flex flex-wrap gap-1.5">
                {drugsInInventory.map((slot) => (
                  <button
                    key={slot.drug}
                    onClick={() => setSelectedDrug(slot.drug)}
                    className={`retro-btn text-[10px] py-1.5 px-2.5 ${
                      selectedDrug === slot.drug ? 'bg-crt-cyan text-black' : ''
                    }`}
                  >
                    {slot.drug} ({slot.quantity})
                  </button>
                ))}
              </div>
            </div>

            {selectedDrug && selected && (
              <>
                {/* Cut percentage */}
                <div>
                  <div className="text-[10px] text-muted-foreground mb-2">Cut percentage:</div>
                  <div className="flex gap-1.5">
                    {LAB_CUT_OPTIONS.map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setCutPercent(pct)}
                        className={`retro-btn text-[10px] py-1.5 px-2 flex-1 ${
                          cutPercent === pct ? 'bg-crt-cyan text-black' : ''
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="retro-card p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Yield:</span>
                    <span className="text-crt-green">
                      {selected.quantity} &rarr; {Math.floor(selected.quantity * multiplier)} ({multiplier}x)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Bust risk:</span>
                    <span className={risk.color}>{risk.text} (1 in {bustChance})</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">On bust:</span>
                    <span className="text-crt-red">Lose 50% + DEA raid</span>
                  </div>
                </div>

                {/* Cut button */}
                <button
                  className="retro-btn w-full py-3 text-xs font-bold font-pixel"
                  onClick={handleCut}
                >
                  CUT DRUGS
                </button>
              </>
            )}
          </div>
        )}

        {/* Cancel button */}
        <button
          className="retro-btn w-full py-2 text-xs font-pixel"
          onClick={closeModal}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

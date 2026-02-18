'use client';

import { useUIStore } from '@/stores/ui-store';
import { useGameStore } from '@/stores/game-store';

const TABS = [
  { key: 'market' as const, label: 'Market', icon: '💊' },
  { key: 'travel' as const, label: 'Travel', icon: '🗺️' },
  { key: 'assets' as const, label: 'Assets', icon: '🏢' },
];

export function ProTabBar() {
  const activeTab = useUIStore((s) => s.activeProTab);
  const setTab = useUIStore((s) => s.setActiveProTab);
  const phase = useGameStore((s) => s.proGameState?.phase);

  if (phase !== 'market') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 text-shadow-sm bg-black/70 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto grid grid-cols-3 gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`py-3 text-center transition-colors ${
              activeTab === tab.key
                ? 'text-crt-cyan border-t-2 border-crt-cyan'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="text-base">{tab.icon}</div>
            <div className="font-pixel text-[8px] mt-0.5">{tab.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

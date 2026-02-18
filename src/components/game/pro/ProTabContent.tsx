'use client';

import { useUIStore } from '@/stores/ui-store';
import { MarketView } from '../MarketView';
import { ProTravelScreen } from './ProTravelScreen';
import { AssetsScreen } from './AssetsScreen';

export function ProTabContent() {
  const activeTab = useUIStore((s) => s.activeProTab);

  switch (activeTab) {
    case 'market':
      return <MarketView />;
    case 'travel':
      return <ProTravelScreen />;
    case 'assets':
      return <AssetsScreen />;
    default:
      return <MarketView />;
  }
}

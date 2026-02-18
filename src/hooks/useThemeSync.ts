'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';

export function useThemeSync() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  // On mount: read saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dope-wars-theme');
    if (saved === 'crt' || saved === 'synthwave' || saved === 'miami') {
      setTheme(saved);
    }
  }, [setTheme]);

  // Sync data-theme attribute to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}

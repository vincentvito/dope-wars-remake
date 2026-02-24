'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getProStatus } from '@/actions/auth';

export function useAuthHydration() {
  const setAuthState = useAuthStore((s) => s.setAuthState);
  const isLoaded = useAuthStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isLoaded) {
      getProStatus()
        .then(setAuthState)
        .catch(() => {
          // On error, still mark as loaded with safe defaults so the app isn't stuck
          setAuthState({ isLoggedIn: false, isPro: false, username: null });
        });
    }
  }, [isLoaded, setAuthState]);
}

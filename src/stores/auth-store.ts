import { create } from 'zustand';

interface AuthStore {
  isLoggedIn: boolean;
  isPro: boolean;
  username: string | null;
  isLoaded: boolean;

  setAuthState: (state: { isLoggedIn: boolean; isPro: boolean; username: string | null }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  isLoggedIn: false,
  isPro: false,
  username: null,
  isLoaded: false,

  setAuthState: (state) => set({ ...state, isLoaded: true }),
  clear: () => set({ isLoggedIn: false, isPro: false, username: null, isLoaded: false }),
}));

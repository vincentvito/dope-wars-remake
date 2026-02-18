'use client';

import { create } from 'zustand';

type ModalType =
  | 'buy'
  | 'sell'
  | 'bank'
  | 'loanShark'
  | 'travel'
  | 'armory'
  | 'lab'
  | null;

type ProTab = 'market' | 'travel' | 'assets';

type Theme = 'crt' | 'synthwave' | 'miami';

export interface GameNotification {
  id: string;
  message: string;
  type: 'profit' | 'loss' | 'neutral';
  duration: number;
}

interface UIStore {
  activeModal: ModalType;
  selectedDrug: string | null;
  settingsOpen: boolean;
  theme: Theme;
  notifications: GameNotification[];
  activeProTab: ProTab;

  openModal: (modal: ModalType, drug?: string) => void;
  closeModal: () => void;
  setSettingsOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setActiveProTab: (tab: ProTab) => void;
  addNotification: (message: string, type: 'profit' | 'loss' | 'neutral') => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  activeModal: null,
  selectedDrug: null,
  settingsOpen: false,
  theme: 'crt',
  notifications: [],
  activeProTab: 'market',

  openModal: (modal, drug) =>
    set({ activeModal: modal, selectedDrug: drug ?? null }),

  closeModal: () =>
    set({ activeModal: null, selectedDrug: null }),

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dope-wars-theme', theme);
    }
    set({ theme });
  },

  setActiveProTab: (tab) => set({ activeProTab: tab }),

  addNotification: (message, type) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = type === 'neutral' ? 3000 : 4000;
    set((state) => ({
      notifications: [...state.notifications, { id, message, type, duration }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

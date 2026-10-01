import { create } from 'zustand';
import { useAuthStore } from '@/stores/useAuthStore.ts';

interface LoginPromptState {
  open: boolean;
  show: () => void;
  hide: () => void;
  promptIfLoggedOut: () => boolean;
}

export const useLoginPromptStore = create<LoginPromptState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  promptIfLoggedOut: () => {
    if (useAuthStore.getState().accessToken) {
      return false;
    }
    set({ open: true });
    return true;
  },
}));

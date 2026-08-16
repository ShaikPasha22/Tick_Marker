import { create } from 'zustand';

interface CommandState {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  isOpen: false,
  openAssistant: () => set({ isOpen: true }),
  closeAssistant: () => set({ isOpen: false }),
}));

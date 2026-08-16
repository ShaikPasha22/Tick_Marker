import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  resolvedTheme: 'light' | 'dark';
  applyTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      resolvedTheme: 'light',

      setTheme: (theme) => {
        set({ theme });
        setTimeout(() => get().applyTheme(), 0);
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      applyTheme: () => {
        const { theme } = get();
        let resolved: 'light' | 'dark';

        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolved = theme;
        }

        document.documentElement.classList.toggle('dark', resolved === 'dark');
        set({ resolvedTheme: resolved });
      },
    }),
    {
      name: 'tickmark-ui',
      partialize: (s) => ({ theme: s.theme, sidebarOpen: s.sidebarOpen }),
    }
  )
);

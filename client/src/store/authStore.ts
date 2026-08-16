import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setAuth: (token, user) => {
        localStorage.setItem('tickmark_token', token);
        set({ token, user });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      logout: () => {
        localStorage.removeItem('tickmark_token');
        set({ user: null, token: null });
      },

      loadUser: async () => {
        const token = localStorage.getItem('tickmark_token');
        if (!token) return;
        try {
          set({ isLoading: true });
          const user = await authApi.getMe();
          set({ user, token });
        } catch {
          localStorage.removeItem('tickmark_token');
          set({ user: null, token: null });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'tickmark-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api/auth';
import { queryClient } from '../queryClient';
import { useFinanceStore } from './financeStore';
import { useTripStore } from './tripStore';

// Drop everything cached for the previous account so a different (or brand new)
// user never sees someone else's tasks, amounts or selections. Real data lives
// in the database and is refetched for whoever signs in next.
function clearUserScopedState() {
  queryClient.clear();
  useFinanceStore.getState().resetForNewSession();
  useTripStore.getState().clearActiveTrip();
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
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
      isLoading: true, // Start true — resolved after hydration check
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setAuth: (token, user) => {
        if (get().user?._id !== user._id) clearUserScopedState();
        localStorage.setItem('tickmark_token', token);
        set({ token, user });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      logout: () => {
        localStorage.removeItem('tickmark_token');
        clearUserScopedState();
        set({ user: null, token: null });
      },

      loadUser: async () => {
        const { token, user } = get();

        // If we already have a user from persisted state, don't block the UI.
        // Just silently refresh in the background to keep data fresh.
        if (token && user) {
          set({ isLoading: false });
          // Silent background refresh — update user data without blocking
          authApi.getMe().then((freshUser) => {
            set({ user: freshUser });
          }).catch((err) => {
            // Only an invalid/expired token ends the session — not a network blip or rate limit
            if (err?.response?.status !== 401) return;
            localStorage.removeItem('tickmark_token');
            clearUserScopedState();
            set({ user: null, token: null });
          });
          return;
        }

        // No persisted user — need to fetch from server
        const storedToken = token || localStorage.getItem('tickmark_token');
        if (!storedToken) {
          set({ isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });
          const freshUser = await authApi.getMe();
          set({ user: freshUser, token: storedToken });
        } catch (err: any) {
          // Keep the token on temporary failures so the next load can retry
          if (err?.response?.status === 401) {
            localStorage.removeItem('tickmark_token');
            clearUserScopedState();
            set({ user: null, token: null });
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'tickmark-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist BOTH token and user so the app remembers the session
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Called once Zustand has finished reading from localStorage
        state?.setHasHydrated(true);
        state && (state.isLoading = false);
      },
    }
  )
);

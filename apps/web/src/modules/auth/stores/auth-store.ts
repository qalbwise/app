import type { components } from "@repo/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const ACCESS = "access_token";
const REFRESH = "refresh_token";

type UserResponse = components["schemas"]["UserResponse"];

type AuthState = {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthActions = {
  setUser: (user: UserResponse | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  logout: () => void;
};

type AuthStore = AuthState & AuthActions;

/**
 * Auth store for managing user authentication state.
 * Handles user data and login status across the app.
 *
 * Tokens are held in memory only (not persisted) to reduce XSS exposure.
 * Only `user` is persisted to localStorage via the `persist` middleware.
 * Re-acquire tokens via your refresh flow on page load.
 *
 * If your API client needs direct localStorage access to tokens, call
 * setTokens() — it syncs to localStorage outside of Immer's set().
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setUser: (user) => {
        set((state) => {
          state.user = user;
        });
      },

      setTokens: (accessToken, refreshToken) => {
        // Side effects outside set() — keep Immer callbacks pure.
        localStorage.setItem(ACCESS, accessToken);
        localStorage.setItem(REFRESH, refreshToken);

        set((state) => {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
        });
      },

      clearTokens: () => {
        // Side effects outside set() — keep Immer callbacks pure.
        localStorage.removeItem(ACCESS);
        localStorage.removeItem(REFRESH);

        set((state) => {
          state.accessToken = null;
          state.refreshToken = null;
        });
      },

      logout: () => {
        // Side effects outside set() — keep Immer callbacks pure.
        localStorage.removeItem(ACCESS);
        localStorage.removeItem(REFRESH);

        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
        });
      },
    })),
    {
      name: "auth-store",
      version: 1,
      // Explicit storage engine + serialization — no implicit fallback behavior.
      storage: createJSONStorage(() => localStorage),
      // Only persist user data — tokens are re-acquired via refresh flow on
      // page load, keeping raw token strings out of localStorage.
      partialize: (state) => ({ user: state.user }),
    }
  )
);

/** Selector hook — plain boolean, re-renders only when login status changes. */
export const useIsLoggedIn = () => useAuthStore((state) => state.user !== null);

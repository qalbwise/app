import { useAuthStore, useIsLoggedIn } from "@/modules/auth/stores/auth-store";

/**
 * Convenience hook for accessing auth state and actions.
 * Provides the most common auth state, tokens, and logout action.
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isLoggedIn,
    accessToken,
    refreshToken,
    logout,
  };
}

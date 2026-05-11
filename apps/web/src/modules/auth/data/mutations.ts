import type { components } from "@repo/core";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/modules/auth/stores/auth-store";

type TokenResponse = components["schemas"]["TokenResponse"];
type GoogleAccessTokenRequest =
  components["schemas"]["GoogleAccessTokenRequest"];

export function useLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation<TokenResponse, Error, GoogleAccessTokenRequest>({
    mutationFn: async (data) => {
      const res = await api.auth.loginWithAccessToken(data);
      if (res.error) throw new Error("Login failed");
      return res.data;
    },

    onSuccess: (data) => {
      if (!data) return;
      setTokens(data.access_token, data.refresh_token);
      toast.success("Logged in successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

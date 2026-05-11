import type { components } from "@repo/core";
import { useMutation } from "@tanstack/react-query";
import { useLocalStorage } from "react-use";
import { toast } from "sonner";
import { api } from "@/lib/api";

type TokenResponse = components["schemas"]["TokenResponse"];
type GoogleAccessTokenRequest =
  components["schemas"]["GoogleAccessTokenRequest"];

export function useLogin() {
  const [, setAccessToken] = useLocalStorage("access_token");
  const [, setRefreshToken] = useLocalStorage("refresh_token");

  return useMutation<TokenResponse, Error, GoogleAccessTokenRequest>({
    mutationFn: async (data) => {
      const res = await api.auth.loginWithAccessToken(data);
      if (res.error) throw new Error("Login failed");
      return res.data;
    },

    onSuccess: (data) => {
      if (!data) return;
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      toast.success("Logged in successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

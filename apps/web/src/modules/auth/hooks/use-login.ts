import type { TokenResponse } from "@repo/core";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.auth.login(data),

    onSuccess: (tokens: TokenResponse) => {
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
    },
  });
};

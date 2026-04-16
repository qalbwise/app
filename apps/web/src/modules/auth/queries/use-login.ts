import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLogin() {
  return useMutation({
    mutationFn: (data: { access_token: string }) => {
      return api.auth.loginWithAccessToken(data);
    },

    onSuccess: ({ data }) => {
      if (!data) return;
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
    },
  });
}

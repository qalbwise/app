import type { components } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { useAuthStore } from "@/modules/auth/stores/auth-store";

type UserResponse = components["schemas"]["UserResponse"];

export function useMe() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery<UserResponse>({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const res = await api.users.me();
      if (res.error) throw new Error("Failed to fetch user");
      setUser(res.data);
      return res.data;
    },
    enabled: Boolean(accessToken),
  });
}

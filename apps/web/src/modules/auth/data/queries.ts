import type { components } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "react-use";
import { api, queryKeys } from "@/lib/api";

type UserResponse = components["schemas"]["UserResponse"];

export function useMe() {
  const [accessToken] = useLocalStorage("access_token");

  return useQuery<UserResponse>({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const res = await api.users.me();
      if (res.error) throw new Error("Failed to fetch user");
      return res.data;
    },
    enabled: Boolean(accessToken),
  });
}

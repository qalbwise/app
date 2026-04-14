import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.users.me(),
    enabled: Boolean(localStorage.getItem("access_token")),
  });
}

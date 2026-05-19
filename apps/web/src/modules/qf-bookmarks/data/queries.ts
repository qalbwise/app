import type { components } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { useIsLoggedIn } from "@/modules/auth/stores/auth-store";

type QfBookmarkListResponse = components["schemas"]["QfBookmarkListResponse"];

export function useQfBookmarks() {
  const isLoggedIn = useIsLoggedIn();
  return useQuery<QfBookmarkListResponse>({
    queryKey: queryKeys.qfBookmarks.all,
    queryFn: async () => {
      const res = await api.qfBookmarks.list();
      if (res.error) throw new Error("Failed to fetch QF bookmarks");
      return res.data;
    },
    enabled: isLoggedIn,
  });
}

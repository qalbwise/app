import type { components } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { useIsLoggedIn } from "@/modules/auth/stores/auth-store";

type BookmarkListResponse = components["schemas"]["BookmarkListResponse"];

export function useBookmarks() {
  const isLoggedIn = useIsLoggedIn();
  return useQuery<BookmarkListResponse>({
    queryKey: queryKeys.bookmarks.all,
    queryFn: async () => {
      const res = await api.bookmarks.list();
      if (res.error) throw new Error("Failed to fetch bookmarks");
      return res.data;
    },
    enabled: isLoggedIn,
  });
}

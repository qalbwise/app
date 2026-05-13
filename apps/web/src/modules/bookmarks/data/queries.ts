import type { components } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { useIsLoggedIn } from "@/modules/auth/stores/auth-store";

type BookmarkListResponse = components["schemas"]["BookmarkListResponse"];
type NoteListResponse = components["schemas"]["NoteListResponse"];

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

export function useNotes() {
  const isLoggedIn = useIsLoggedIn();
  return useQuery<NoteListResponse>({
    queryKey: queryKeys.notes.all,
    queryFn: async () => {
      const res = await api.bookmarks.listNotes();
      if (res.error) throw new Error("Failed to fetch notes");
      return res.data;
    },
    enabled: isLoggedIn,
  });
}

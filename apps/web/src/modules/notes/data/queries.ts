import type { components } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { useIsLoggedIn } from "@/modules/auth/stores/auth-store";

type NoteListResponse = components["schemas"]["NoteListResponse"];

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

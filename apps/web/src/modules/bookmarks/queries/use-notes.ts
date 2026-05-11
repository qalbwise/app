import type { components } from "@repo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "react-use";
import { toast } from "sonner";
import { api, queryKeys } from "@/lib/api";

type NoteListResponse = components["schemas"]["NoteListResponse"];
type NoteResponse = components["schemas"]["NoteResponse"];
type NoteCreate = components["schemas"]["NoteCreate"];

function useIsLoggedIn() {
  const [accessToken] = useLocalStorage("access_token");
  return Boolean(accessToken);
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

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation<NoteResponse, Error, NoteCreate>({
    mutationFn: async (body) => {
      const res = await api.bookmarks.createNote({
        ...body,
        verses: body.verses ?? undefined,
      });
      if (res.error) throw new Error("Failed to create note");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.bookmarks.deleteNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

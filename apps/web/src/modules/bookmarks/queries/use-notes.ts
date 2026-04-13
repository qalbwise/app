import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

type NoteCreate = {
  topic: string;
  content: string;
  verses?: Record<string, unknown>[];
};

function isLoggedIn() {
  return Boolean(localStorage.getItem("access_token"));
}

export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes.all,
    queryFn: () => api.bookmarks.listNotes(),
    enabled: isLoggedIn(),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NoteCreate) => api.bookmarks.createNote(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.bookmarks.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}

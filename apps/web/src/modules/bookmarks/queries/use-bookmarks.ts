import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, queryKeys } from "@/lib/api";

type BookmarkCreate = {
  ayah_key: string;
  surah_name: string;
  arabic_text: string;
  translation: string;
  note?: string;
  extra_data?: Record<string, unknown>;
};

function isLoggedIn() {
  return Boolean(localStorage.getItem("access_token"));
}

export function useBookmarks() {
  return useQuery({
    queryKey: queryKeys.bookmarks.all,
    queryFn: () => api.bookmarks.list(),
    enabled: isLoggedIn(),
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BookmarkCreate) => api.bookmarks.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.bookmarks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    },
  });
}

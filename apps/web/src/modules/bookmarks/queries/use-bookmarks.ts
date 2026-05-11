import type { components } from "@repo/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "react-use";
import { toast } from "sonner";

import { api, queryKeys } from "@/lib/api";

type BookmarkListResponse = components["schemas"]["BookmarkListResponse"];
type BookmarkResponse = components["schemas"]["BookmarkResponse"];
type BookmarkCreate = components["schemas"]["BookmarkCreate"];

function useIsLoggedIn() {
  const [accessToken] = useLocalStorage("access_token");
  return Boolean(accessToken);
}

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

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation<BookmarkResponse, Error, BookmarkCreate>({
    mutationFn: async (body) => {
      const res = await api.bookmarks.create({
        ...body,
        note: body.note ?? undefined,
        extra_data: body.extra_data ?? undefined,
      });
      if (res.error) throw new Error("Failed to create bookmark");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.bookmarks.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

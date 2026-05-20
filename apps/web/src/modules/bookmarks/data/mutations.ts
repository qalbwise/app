import type { components } from "@repo/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryKeys } from "@/lib/api";

type BookmarkResponse = components["schemas"]["BookmarkResponse"];
type BookmarkCreate = components["schemas"]["BookmarkCreate"];
type BookmarkListResponse = components["schemas"]["BookmarkListResponse"];

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation<BookmarkResponse, Error, BookmarkCreate>({
    mutationFn: async (body) => {
      const res = await api.bookmarks.create(body);
      if (res.error) throw new Error("Failed to create bookmark");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
      toast.success("Bookmark saved");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    string,
    { previous: BookmarkListResponse | undefined }
  >({
    mutationFn: async (id) => {
      const res = await api.bookmarks.delete(id);
      if (res.error) throw new Error("Failed to delete bookmark");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarks.all });
      const previous = queryClient.getQueryData<BookmarkListResponse>(
        queryKeys.bookmarks.all
      );
      if (previous) {
        queryClient.setQueryData<BookmarkListResponse>(
          queryKeys.bookmarks.all,
          {
            bookmarks: previous.bookmarks.filter((b) => b.id !== id),
          }
        );
      }
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.bookmarks.all, context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Bookmark removed");
    },
  });
}

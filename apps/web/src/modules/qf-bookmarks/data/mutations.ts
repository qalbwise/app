import type { components } from "@repo/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryKeys } from "@/lib/api";

type QfBookmarkCreate = components["schemas"]["QfBookmarkCreate"];
type QfBookmarkResponse = components["schemas"]["QfBookmarkResponse"];

export function useCreateQfBookmark() {
  const queryClient = useQueryClient();
  return useMutation<QfBookmarkResponse, Error, QfBookmarkCreate>({
    mutationFn: async (body) => {
      const res = await api.qfBookmarks.create(body);
      if (res.error) throw new Error("Failed to save QF bookmark");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.qfBookmarks.all });
      toast.success("Saved to Quran Foundation");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteQfBookmark() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await api.qfBookmarks.delete(id);
      if (res.error) throw new Error("Failed to delete QF bookmark");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.qfBookmarks.all });
      toast.success("Removed from Quran Foundation");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

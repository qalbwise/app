import type { components } from "@repo/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryKeys } from "@/lib/api";

type NoteResponse = components["schemas"]["NoteResponse"];
type NoteCreate = components["schemas"]["NoteCreate"];

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation<NoteResponse, Error, NoteCreate>({
    mutationFn: async (body) => {
      const res = await api.notes.create(body);
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
      await api.notes.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

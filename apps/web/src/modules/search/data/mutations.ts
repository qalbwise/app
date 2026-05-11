import type { components } from "@repo/core";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

type SearchCreateResponse = components["schemas"]["SearchCreateResponse"];

export function useCreateSearch() {
  return useMutation<SearchCreateResponse, Error, { topic: string }>({
    mutationFn: async (data) => {
      const res = await api.search.create(data);
      if (res.error) throw new Error("Failed to create search");
      return res.data;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

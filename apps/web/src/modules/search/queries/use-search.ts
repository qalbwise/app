import type { components } from "@repo/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryKeys } from "@/lib/api";

type SearchCreateResponse = components["schemas"]["SearchCreateResponse"];
type SearchResponse = components["schemas"]["SearchResponse"];
type VersePageResponse = components["schemas"]["VersePageResponse"];

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

const POLL_TIMEOUT_MS = 3 * 60 * 1000; // stop polling after 3 minutes

export function useSearchBySlug(slug: string, enabled = true) {
  return useQuery<SearchResponse>({
    queryKey: queryKeys.search.bySlug(slug),
    queryFn: async () => {
      const res = await api.search.getBySlug(slug);
      if (res.error) throw new Error("Failed to fetch search");
      return res.data;
    },
    enabled,
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === "complete" || status === "failed") return false;
      // Stop polling after timeout to prevent infinite spam
      const dataUpdatedAt = q.state.dataUpdatedAt;
      if (dataUpdatedAt && Date.now() - dataUpdatedAt > POLL_TIMEOUT_MS)
        return false;
      return 3000; // poll every 3s (was 2s)
    },
    gcTime: 5 * 60 * 1000,
  });
}

export function useVersePage(slug: string, page: number, enabled = true) {
  return useQuery<VersePageResponse>({
    queryKey: queryKeys.search.versePage(slug, page),
    queryFn: async () => {
      const res = await api.search.getVersePage(slug, page);
      if (res.error) throw new Error("Failed to fetch verse page");
      return res.data;
    },
    enabled,
  });
}

export function useExplainVerse(slug: string, page: number, enabled = true) {
  return useQuery<VersePageResponse>({
    queryKey: queryKeys.search.explainVerse(slug, page),
    queryFn: async () => {
      const res = await api.search.explainVerse(slug, page);
      if (res.error) throw new Error("Failed to explain verse");
      return res.data as VersePageResponse;
    },
    enabled,
  });
}

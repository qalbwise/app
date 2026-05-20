import type { components } from "@repo/core";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

type SearchResponse = components["schemas"]["SearchResponse"];
export type VersePageResponse = components["schemas"]["VersePageResponse"];
export type ExplainVerseResponse = {
  why_this_verse?: string | null;
};

const POLL_TIMEOUT_MS = 3 * 60 * 1000; // stop polling after 3 minutes

export function useSearchBySlug(slug: string, enabled = true) {
  return useQuery<SearchResponse>({
    queryKey: queryKeys.search.bySlug(slug),
    queryFn: async () => {
      const res = await api.search.getBySlug(slug);
      if (res.error) {
        if (res.response.status === 404) throw new Error("NOT_FOUND");
        throw new Error("Failed to fetch search");
      }
      return res.data;
    },
    enabled,
    refetchInterval: (q) => {
      if (q.state.error?.message === "NOT_FOUND") return false;
      const status = q.state.data?.status;
      if (status === "complete" || status === "failed") return false;
      const dataUpdatedAt = q.state.dataUpdatedAt;
      if (dataUpdatedAt && Date.now() - dataUpdatedAt > POLL_TIMEOUT_MS)
        return false;
      return 3000;
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
  return useQuery<ExplainVerseResponse>({
    queryKey: queryKeys.search.explainVerse(slug, page),
    queryFn: async () => {
      const res = await api.search.explainVerse(slug, page);
      if (res.error) throw new Error("Failed to explain verse");
      return res.data as ExplainVerseResponse;
    },
    enabled,
  });
}

import { useMutation, useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export function useCreateSearch() {
  return useMutation({
    mutationFn: (topic: string) => api.search.create({ topic }),
  });
}

const POLL_TIMEOUT_MS = 3 * 60 * 1000; // stop polling after 3 minutes

export function useSearchBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.bySlug(slug),
    queryFn: () => api.search.getBySlug(slug),
    enabled,
    refetchInterval: (q) => {
      const status = q.state.data?.data?.status;
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
  return useQuery({
    queryKey: queryKeys.search.versePage(slug, page),
    queryFn: () => api.search.getVersePage(slug, page),
    enabled,
  });
}

export function useExplainVerse(slug: string, page: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.explainVerse(slug, page),
    queryFn: () => api.search.explainVerse(slug, page),
    enabled,
  });
}

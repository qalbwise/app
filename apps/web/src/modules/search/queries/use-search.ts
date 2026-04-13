import { useMutation, useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";

export function useCreateSearch() {
  return useMutation({
    mutationFn: (topic: string) => api.search.create({ topic }),
  });
}

export function useSearchBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.bySlug(slug),
    queryFn: () => api.search.getBySlug(slug),
    enabled,
    refetchInterval: (q) => {
      if (q.state.data?.data?.status === "complete") return false;
      if (q.state.data?.data?.status === "failed") return false;
      return 2000;
    },
  });
}

export function useTafsir(ayahKey: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tafsir.byAyahKey(ayahKey),
    queryFn: () => api.tafsir.get(ayahKey),
    enabled,
  });
}

export function useVerseExplain(slug: string, ayahKey: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.explain(slug, ayahKey),
    queryFn: () => api.search.explain(slug, ayahKey),
    enabled,
  });
}

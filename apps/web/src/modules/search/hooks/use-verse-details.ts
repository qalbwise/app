import { useQueries } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import type {
  ExplainVerseResponse,
  VersePageResponse,
} from "@/modules/search/data/queries";

interface VerseResult {
  ayah_key: string;
  [key: string]: unknown;
}

export function useVerseDetails(slug: string, verseResults: VerseResult[]) {
  const queries = useQueries({
    queries: verseResults.flatMap((verse, index) => {
      const page = index + 1;
      const enabled = Boolean(slug && verse.ayah_key);

      return [
        {
          queryKey: queryKeys.search.versePage(slug, page),
          queryFn: async (): Promise<VersePageResponse> => {
            const res = await api.search.getVersePage(slug, page);
            if (res.error) throw new Error("Failed to fetch verse page");
            return res.data;
          },
          enabled,
        },
        {
          queryKey: queryKeys.search.explainVerse(slug, page),
          queryFn: async (): Promise<ExplainVerseResponse> => {
            const res = await api.search.explainVerse(slug, page);
            if (res.error) throw new Error("Failed to explain verse");
            return res.data as ExplainVerseResponse;
          },
          enabled,
        },
      ];
    }),
  });

  return queries;
}

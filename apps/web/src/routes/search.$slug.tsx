import type { components } from "@repo/core";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/api";
import { duration, easing } from "@/lib/motions";
import { LoginDrawer } from "@/modules/auth/components/login-drawer";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { useCreateBookmark } from "@/modules/bookmarks/data/mutations";
import {
  SearchHeader,
  SearchTopicDisplay,
} from "@/modules/search/components/search-header";
import { SearchLoading } from "@/modules/search/components/search-loading";
import { SearchPagination } from "@/modules/search/components/search-pagination";
import { SearchResultsList } from "@/modules/search/components/search-results-list";
import { useOfflineToast } from "@/modules/search/hooks/use-offline-toast";
import { useSearchPagination } from "@/modules/search/hooks/use-search-pagination";
import { useSearchState } from "@/modules/search/hooks/use-search-state";
import { useVerseDetails } from "@/modules/search/hooks/use-verse-details";

export const Route = createFileRoute("/search/$slug")({
  component: SearchPage,
  head: ({ params }) => ({
    meta: [{ title: `Search: ${decodeURIComponent(params.slug)} | Qalbwise` }],
  }),
});

type VerseResult = components["schemas"]["VerseResult"];

function SearchPage() {
  const { slug } = Route.useParams();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingSaveAyah, setPendingSaveAyah] = useState<string | null>(null);

  const auth = useAuth();
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();

  const { topic, verseResults, isLoading, isDefinitelyFailed, stepMessage } =
    useSearchState({ slug });

  useVerseDetails(slug, verseResults);
  useOfflineToast({ slug, query: { isSuccess: true } });

  const {
    totalPages,
    normalizedCurrentPage,
    pageStart,
    visibleResults,
    goToPage,
  } = useSearchPagination({ results: verseResults });

  function handleSaveVerse(ayahKey: string) {
    const isLoggedIn = auth.isLoggedIn || Boolean(auth.accessToken);
    if (!isLoggedIn) {
      setPendingSaveAyah(ayahKey);
      setLoginSheetOpen(true);
    }
  }

  async function handleLoginSuccess() {
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    setLoginSheetOpen(false);

    if (!pendingSaveAyah) return;

    const verse = verseResults.find(
      (item): item is VerseResult => item.ayah_key === pendingSaveAyah
    );
    setPendingSaveAyah(null);

    if (!verse) return;

    await createBookmark.mutateAsync({
      ayah_key: verse.ayah_key,
      surah_name: verse.surah_name,
      arabic_text: verse.arabic_text,
      translation: verse.translation,
    });
  }

  return (
    <>
      {isLoading ? (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.normal, ease: easing.out }}
          className="relative mt-[20svh]"
        >
          <SearchLoading query={topic} />
          <p
            aria-live="polite"
            className="mt-4 text-center text-muted-foreground text-sm"
          >
            {stepMessage}
          </p>
        </motion.section>
      ) : (
        <section className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.normal, ease: easing.out }}
          >
            <SearchHeader totalResults={verseResults.length} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.normal,
              ease: easing.out,
              delay: 0.08,
            }}
            className="flex justify-center"
          >
            <SearchTopicDisplay topic={topic} />
          </motion.div>
        </section>
      )}

      {isDefinitelyFailed && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.out }}
          className="relative mt-8 text-center"
        >
          <p className="text-muted-foreground">
            We could not complete this search. Please try again.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            nativeButton={false}
            render={<Link to="/">Retry Search</Link>}
          />
        </motion.section>
      )}

      {!isLoading && !isDefinitelyFailed && verseResults.length > 0 && (
        <>
          <SearchResultsList
            visibleResults={visibleResults}
            slug={slug}
            pageStart={pageStart}
            onSaveRequest={handleSaveVerse}
          />

          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.2,
              duration: duration.fast,
              ease: easing.out,
            }}
            className="mt-8"
          >
            <SearchPagination
              totalPages={totalPages}
              currentPage={normalizedCurrentPage}
              onPageChange={goToPage}
            />
          </motion.section>
        </>
      )}

      <LoginDrawer
        open={loginSheetOpen}
        onOpenChange={setLoginSheetOpen}
        promptContext="Save this verse"
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

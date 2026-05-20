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

function SearchPage() {
  const { slug } = Route.useParams();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingSaveAyah, setPendingSaveAyah] = useState<string | null>(null);

  const auth = useAuth();
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();

  const {
    topic,
    verseResults,
    isLoading,
    isDefinitelyFailed,
    isNotFound,
    stepMessage,
  } = useSearchState({ slug });

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
    queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.all });
    setLoginSheetOpen(false);

    if (!pendingSaveAyah) return;

    setPendingSaveAyah(null);

    await createBookmark.mutateAsync({ ayah_key: pendingSaveAyah });
  }

  return (
    <>
      {isLoading && (
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
      )}

      {isNotFound && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.out }}
          className="relative mt-[20svh] text-balance text-center"
        >
          <p className="text-2xl">This search was not found</p>
          <p className="mt-2 text-muted-foreground text-sm">
            The search you are looking for does not exist or may have been
            removed.
          </p>
          <Button
            aria-label="Go back to homepage"
            className="mt-6"
            variant="outline"
            nativeButton={false}
            render={<Link to="/">Go Home</Link>}
          />
        </motion.section>
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

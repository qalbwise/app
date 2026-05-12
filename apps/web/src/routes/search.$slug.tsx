import { useQueries, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNetworkState } from "react-use";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { api, queryKeys } from "@/lib/api";
import { LoginSheet } from "@/modules/auth/components/login-sheet";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { useCreateBookmark } from "@/modules/bookmarks/data/mutations";
import { SearchLoading } from "@/modules/search/components/search-loading";
import { VerseCard } from "@/modules/search/components/verse-card";
import {
  type ExplainVerseResponse,
  useSearchBySlug,
  type VersePageResponse,
} from "@/modules/search/data/queries";
import { useSearchStream } from "@/modules/search/hooks/use-search-stream";

export const Route = createFileRoute("/search/$slug")({
  component: SearchPage,
});

const STEP_MESSAGES: Record<string, string> = {
  searching_quran: "Searching the Quran…",
  fetching_metadata: "Gathering verse details…",
  ranking: "Preparing your results…",
  pending: "Preparing your search…",
  processing: "Searching the Quran…",
};

const VERSES_PER_PAGE = 1;

function SearchPage() {
  const { slug } = Route.useParams();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingSaveAyah, setPendingSaveAyah] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const offlineToastShownRef = useRef(false);
  const network = useNetworkState();
  const online = network.online ?? true;
  const auth = useAuth();
  const createBookmark = useCreateBookmark();
  const queryClient = useQueryClient();
  const wasCacheHit =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(`search-cache-hit-${slug}`) === "1";

  /* Primary: SSE real-time stream */
  const stream = useSearchStream(slug, !wasCacheHit);

  /*
   * Fallback polling:
   * - Only enabled when SSE connection is lost (not running alongside a healthy stream)
   * - Stops once complete/failed
   */
  const isStreamDone =
    stream.status === "complete" || stream.status === "failed";
  const pollEnabled =
    wasCacheHit ||
    stream.connectionLost ||
    isStreamDone ||
    (stream.status === "idle" && !isStreamDone);
  const query = useSearchBySlug(slug, pollEnabled);

  /* Source of truth: prefer SSE results when complete, else polling data */
  const searchData = query.data;
  const topic = searchData?.topic ?? "";

  const currentStatus =
    stream.status !== "idle" && stream.status !== "pending"
      ? stream.status
      : (searchData?.status ?? "pending");

  /* Prefer SSE payload; if complete but stream omitted results, use GET body */
  const results =
    stream.results && stream.results.length > 0
      ? stream.results
      : (searchData?.results ?? null);
  const verseResults = results ?? [];

  useQueries({
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

  /* Connection lost + polling error = definitive failure */
  const isDefinitelyFailed =
    currentStatus === "failed" || (stream.connectionLost && query.isError);

  const isLoading =
    !isDefinitelyFailed &&
    currentStatus !== "complete" &&
    currentStatus !== "failed";

  const stepMessage =
    STEP_MESSAGES[stream.step ?? currentStatus] ?? "Searching…";

  const totalResults = verseResults.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / VERSES_PER_PAGE));
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (normalizedCurrentPage - 1) * VERSES_PER_PAGE;
  const visibleResults = verseResults.slice(
    pageStart,
    pageStart + VERSES_PER_PAGE
  );

  /* One-time toast per slug when offline with cached results */
  useEffect(() => {
    const sessionKey = `offline-toast-${slug}`;
    if (online) {
      offlineToastShownRef.current = false;
      return;
    }
    if (
      query.isSuccess &&
      !offlineToastShownRef.current &&
      !sessionStorage.getItem(sessionKey)
    ) {
      offlineToastShownRef.current = true;
      sessionStorage.setItem(sessionKey, "1");
      toast.message("You're offline — viewing cached results");
    }
  }, [online, query.isSuccess, slug]);

  function handleSaveVerse(ayahKey: string) {
    const isLoggedIn = auth.isLoggedIn || Boolean(auth.accessToken);
    if (!isLoggedIn) {
      setPendingSaveAyah(ayahKey);
      setLoginSheetOpen(true);
    }
    /* If logged in, VerseCard handles the save action directly */
  }

  async function handleLoginSuccess() {
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
    setLoginSheetOpen(false);

    if (!pendingSaveAyah) return;

    const verse = verseResults.find(
      (item) => item.ayah_key === pendingSaveAyah
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

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  return (
    <>
      {isLoading ? (
        <section className="relative mt-8">
          <SearchLoading query={topic} />
          <p className="mt-4 text-center text-muted-foreground text-sm">
            {stepMessage}
          </p>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="relative flex flex-col gap-y-2 md:flex-row md:justify-center">
            <Button
              className="left-0 self-start md:absolute"
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link to="/">
                  <ChevronLeft />
                  New Search
                </Link>
              }
            />

            <h1 className="relative">
              Showing <span className="font-bold">{totalResults} results </span>
              of:
            </h1>
          </div>

          <span className="text-balance text-center font-medium font-sans text-2xl italic">
            “{topic}”
          </span>
        </section>
      )}

      {isDefinitelyFailed && (
        <section className="relative mt-8 text-center">
          <p className="text-muted-foreground">
            We could not complete this search. Please try again.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            nativeButton={false}
            render={<Link to="/">Retry Search</Link>}
          />
        </section>
      )}

      {!isLoading && !isDefinitelyFailed && totalResults > 0 && (
        <>
          <section className="relative mt-8">
            <div className="pointer-events-none absolute inset-x-3 top-0 h-12 bg-linear-to-b from-card to-transparent sm:inset-x-6" />
            <div className="pointer-events-none absolute inset-x-3 bottom-0 h-14 bg-linear-to-t from-card to-transparent sm:inset-x-6" />

            {visibleResults.map((verse, index) => (
              <VerseCard
                key={verse.ayah_key}
                verse={verse}
                rank={pageStart + index}
                slug={slug}
                onSaveRequest={handleSaveVerse}
              />
            ))}
          </section>

          <section className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(normalizedCurrentPage - 1);
                    }}
                    disabled={normalizedCurrentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === normalizedCurrentPage}
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(normalizedCurrentPage + 1);
                    }}
                    disabled={normalizedCurrentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </section>
        </>
      )}

      <LoginSheet
        open={loginSheetOpen}
        onOpenChange={setLoginSheetOpen}
        promptContext="Save this verse"
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}

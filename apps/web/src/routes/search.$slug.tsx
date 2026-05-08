import type { components } from "@repo/core";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNetworkState } from "react-use";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { useSearchStream } from "@/modules/search/hooks/use-search-stream";
import { useSearchBySlug } from "@/modules/search/queries/use-search";

type VerseResult = components["schemas"]["VerseResult"];

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

function SearchPage() {
  const { slug } = Route.useParams();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingSaveAyah, setPendingSaveAyah] = useState<string | null>(null);
  const offlineToastShownRef = useRef(false);
  const network = useNetworkState();
  const online = network.online ?? true;
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
    (stream.status === "idle" && !isStreamDone);
  const query = useSearchBySlug(slug, pollEnabled);

  /* Source of truth: prefer SSE results when complete, else polling data */
  const searchData = query.data?.data;
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

  /* Connection lost + polling error = definitive failure */
  const isDefinitelyFailed =
    currentStatus === "failed" || (stream.connectionLost && query.isError);

  const isLoading =
    !isDefinitelyFailed &&
    currentStatus !== "complete" &&
    currentStatus !== "failed";

  const stepMessage =
    STEP_MESSAGES[stream.step ?? currentStatus] ?? "Searching…";

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
    const isLoggedIn = Boolean(localStorage.getItem("access_token"));
    if (!isLoggedIn) {
      setPendingSaveAyah(ayahKey);
      setLoginSheetOpen(true);
    }
    /* If logged in, VerseCard handles the save action directly */
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="relative flex flex-col gap-y-2 md:flex-row md:justify-center">
          <Link
            to="/"
            className="left-0 flex items-center gap-1 text-sm transition-all hover:text-muted-foreground hover:underline md:absolute"
          >
            <ChevronLeft />
            New Search
          </Link>

          <h1 className="relative">
            Showing <span className="font-bold">5 results </span>of:
          </h1>
        </div>

        <span className="text-balance text-center font-medium font-sans text-2xl italic">
          “I needed some guide to always be grateful towards that I already
          have”
        </span>
      </section>

      <section className="mt-8">
        <Card className="px-7 py-8 font-sans">
          <CardHeader className="flex flex-col items-center gap-4 italic">
            <div className="flex items-center justify-center gap-4">
              <h1 className="font-medium text-xl">Surah 79 (An-Nazi'at)</h1>

              <span className="rounded-3xl border border-border bg-secondary px-3 py-1 font-medium">
                79 : 8
              </span>
            </div>

            <a
              href="https://quran.com/79/8"
              target="_blank"
              rel="noreferrer noopener"
              className="text-center text-secondary-foreground underline transition-all hover:text-muted-foreground"
            >
              quran.com reference
            </a>
          </CardHeader>
        </Card>
      </section>
    </>
  );
}

import type { components } from "@repo/core";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LoginSheet } from "@/modules/auth/components/login-sheet";
import { VerseCard } from "@/modules/search/components/verse-card";
import { useSearchStream } from "@/modules/search/hooks/use-search-stream";
import { useSearchBySlug } from "@/modules/search/queries/use-search";

type VerseResult = components["schemas"]["VerseResult"];

export const Route = createFileRoute("/search/$slug")({
  component: SearchPage,
});

const STEP_MESSAGES: Record<string, string> = {
  searching_quran: "Searching the Quran…",
  ranking: "Ranking the best matches…",
  pending: "Preparing your search…",
  processing: "Searching the Quran…",
};

function SearchPage() {
  const { slug } = Route.useParams();
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [pendingSaveAyah, setPendingSaveAyah] = useState<string | null>(null);

  /* Primary: SSE real-time stream */
  const stream = useSearchStream(slug);

  /*
   * Fallback polling:
   * - Only enabled when SSE connection is lost (not running alongside a healthy stream)
   * - Stops once complete/failed
   */
  const isStreamDone =
    stream.status === "complete" || stream.status === "failed";
  const pollEnabled =
    stream.connectionLost || (stream.status === "idle" && !isStreamDone);
  const query = useSearchBySlug(slug, pollEnabled);

  /* Source of truth: prefer SSE results when complete, else polling data */
  const searchData = query.data?.data;
  const topic = searchData?.topic ?? "";

  const results =
    stream.status === "complete" && stream.results
      ? stream.results
      : (searchData?.results ?? null);

  const currentStatus =
    stream.status !== "idle"
      ? stream.status
      : (searchData?.status ?? "pending");

  /* Connection lost + polling error = definitive failure */
  const isDefinitelyFailed =
    currentStatus === "failed" || (stream.connectionLost && query.isError);

  const isLoading =
    !isDefinitelyFailed &&
    currentStatus !== "complete" &&
    currentStatus !== "failed";

  const stepMessage =
    STEP_MESSAGES[stream.step ?? currentStatus] ?? "Searching…";

  function handleSaveVerse(ayahKey: string) {
    const isLoggedIn = Boolean(localStorage.getItem("access_token"));
    if (!isLoggedIn) {
      setPendingSaveAyah(ayahKey);
      setLoginSheetOpen(true);
    }
    /* If logged in, VerseCard handles the save action directly */
  }

  return (
    <div className="min-h-[calc(100vh-56px-80px)] bg-white px-4 py-14">
      <div className="page-wrap max-w-2xl">
        {/* Back link */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-[14px] no-underline transition-colors hover:text-black"
          style={{ color: "#777169" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8.5 2.5L4 7l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New search
        </Link>

        {/* Topic heading */}
        {topic ? (
          <h1 className="display-heading mb-2">{topic}</h1>
        ) : (
          <div
            className="skeleton-pulse mb-2 h-9 w-64 rounded-lg"
            aria-hidden="true"
          />
        )}

        {/* Status / count line */}
        {isLoading ? (
          <p className="caption mb-10 fade-up">{stepMessage}</p>
        ) : (
          results && (
            <p className="caption mb-10">
              {results.length} {results.length === 1 ? "verse" : "verses"} found
            </p>
          )
        )}

        {/* Content */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard delay={80} />
              <SkeletonCard delay={160} />
            </>
          ) : isDefinitelyFailed ||
            currentStatus === "failed" ||
            query.isError ? (
            <div className="card-surface p-10 text-center">
              <p className="mb-4 text-[15px]" style={{ color: "#4e4e4e" }}>
                Search failed. Please try a different topic.
              </p>
              <Link
                to="/"
                className="pill-btn-black inline-flex no-underline"
                style={{ height: "40px", padding: "0 20px" }}
              >
                Try again
              </Link>
            </div>
          ) : !results || results.length === 0 ? (
            <div className="card-surface p-10 text-center">
              <p
                className="mb-2 text-[15px] font-medium"
                style={{ color: "#4e4e4e" }}
              >
                No verses found
              </p>
              <p className="mb-6 text-[14px]" style={{ color: "#777169" }}>
                Try rephrasing your topic in different words.
              </p>
              <Link
                to="/"
                className="pill-btn-black inline-flex no-underline"
                style={{ height: "40px", padding: "0 20px" }}
              >
                Search again
              </Link>
            </div>
          ) : (
            (results as VerseResult[]).map(
              (verse: VerseResult, index: number) => (
                <div
                  key={verse.ayah_key}
                  className="fade-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <VerseCard
                    verse={verse}
                    rank={index}
                    slug={slug}
                    onSaveRequest={handleSaveVerse}
                  />
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* Login bottom sheet */}
      <LoginSheet
        open={loginSheetOpen}
        onOpenChange={setLoginSheetOpen}
        promptContext="Save your verse"
        onSuccess={() => {
          setLoginSheetOpen(false);
          if (pendingSaveAyah) {
            /* After login, user can re-tap save */
            setPendingSaveAyah(null);
          }
        }}
      />
    </div>
  );
}

const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="card-surface p-6"
    style={{ animationDelay: `${delay}ms` }}
    aria-hidden="true"
  >
    {/* Header row */}
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="skeleton-pulse h-3 w-28 rounded" />
        <span className="skeleton-pulse h-3 w-10 rounded" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="skeleton-pulse h-1.5 w-1.5 rounded-full" />
        ))}
      </div>
    </div>
    {/* Arabic block */}
    <div className="skeleton-pulse mb-4 h-14 w-full rounded-xl" />
    {/* Translation lines */}
    <div className="skeleton-pulse mb-2 h-4 w-full rounded" />
    <div className="skeleton-pulse mb-5 h-4 w-4/5 rounded" />
    {/* Action row */}
    <div className="flex gap-2">
      <span className="skeleton-pulse h-7 w-28 rounded-full" />
      <span className="skeleton-pulse h-7 w-24 rounded-full" />
      <span className="skeleton-pulse h-7 w-20 rounded-full" />
    </div>
  </div>
);

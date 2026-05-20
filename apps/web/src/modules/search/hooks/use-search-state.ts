import type { components } from "@repo/core";
import { useSearchBySlug } from "../data/queries";
import { useSearchStream } from "./use-search-stream";

type VerseResult = components["schemas"]["VerseResult"];

interface UseSearchStateOptions {
  slug: string;
}

interface UseSearchStateResult {
  topic: string;
  verseResults: VerseResult[];
  currentStatus: string;
  isLoading: boolean;
  isDefinitelyFailed: boolean;
  isNotFound: boolean;
  stepMessage: string;
  step: string | undefined;
  totalResults: number;
}

const STEP_MESSAGES: Record<string, string> = {
  searching_quran: "Searching the Quran…",
  fetching_metadata: "Gathering verse details…",
  saving: "Saving your results…",
};

function getCacheHit(slug: string): boolean {
  return (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(`search-cache-hit-${slug}`) === "1"
  );
}

function setCacheHit(slug: string): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(`search-cache-hit-${slug}`, "1");
  }
}

export function useSearchState({
  slug,
}: UseSearchStateOptions): UseSearchStateResult {
  const wasCacheHit = getCacheHit(slug);

  const stream = useSearchStream(slug, !wasCacheHit, () => setCacheHit(slug));

  const isStreamDone =
    stream.status === "complete" || stream.status === "failed";
  const pollEnabled =
    wasCacheHit ||
    stream.connectionLost ||
    isStreamDone ||
    (stream.status === "idle" && !isStreamDone);
  const query = useSearchBySlug(slug, pollEnabled);

  const searchData = query.data;
  const topic = searchData?.topic ?? "";

  const currentStatus =
    stream.status !== "idle" && stream.status !== "pending"
      ? stream.status
      : (searchData?.status ?? "pending");

  const results =
    stream.results && stream.results.length > 0
      ? stream.results
      : (searchData?.results ?? null);
  const verseResults = results ?? [];

  const isNotFound = query.isError && query.error?.message === "NOT_FOUND";

  const isDefinitelyFailed =
    (currentStatus === "failed" || (stream.connectionLost && query.isError)) &&
    !isNotFound;

  const isLoading =
    !isDefinitelyFailed &&
    currentStatus !== "complete" &&
    currentStatus !== "failed";

  const stepMessage =
    STEP_MESSAGES[stream.step ?? currentStatus] ?? "Searching…";

  return {
    topic,
    verseResults,
    currentStatus,
    isLoading: isLoading && !isNotFound,
    isDefinitelyFailed,
    isNotFound,
    stepMessage,
    step: stream.step ?? undefined,
    totalResults: verseResults.length,
  };
}

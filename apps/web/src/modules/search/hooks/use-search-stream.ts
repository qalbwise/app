import type { components } from "@repo/core";
import { useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base-url";

type VerseResult = components["schemas"]["VerseResult"];

export type SearchStreamStatus =
  | "idle"
  | "pending"
  | "processing"
  | "complete"
  | "failed";

export interface SearchStreamState {
  status: SearchStreamStatus;
  step: string | null;
  results: VerseResult[] | null;
  /** Set when SSE connection drops before completion */
  connectionLost: boolean;
}

/**
 * Opens an SSE connection to `/search/{slug}/stream` and tracks progress.
 * Closes automatically on `complete` or `failed`.
 * Sets `connectionLost: true` if the connection drops mid-flight so the
 * caller can activate TanStack Query polling as a fallback.
 */
export function useSearchStream(
  slug: string,
  enabled = true,
  onComplete?: () => void
): SearchStreamState {
  const [state, setState] = useState<SearchStreamState>({
    status: "idle",
    step: null,
    results: null,
    connectionLost: false,
  });

  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!slug || !enabled) {
      esRef.current?.close();
      setState({
        status: "idle",
        step: null,
        results: null,
        connectionLost: false,
      });
      return;
    }

    doneRef.current = false;

    const es = new EventSource(`${getApiBaseUrl()}/search/${slug}/stream`);
    esRef.current = es;

    setState({
      status: "pending",
      step: null,
      results: null,
      connectionLost: false,
    });

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const event = JSON.parse(e.data) as {
          status: SearchStreamStatus;
          step?: string | null;
          results?: VerseResult[] | null;
        };

        setState({
          status: event.status,
          step: event.step ?? null,
          results: event.results ?? null,
          connectionLost: false,
        });

        if (event.status === "complete" || event.status === "failed") {
          doneRef.current = true;
          es.close();
          if (event.status === "complete" && onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      } catch {
        /* ignore JSON parse errors */
      }
    };

    es.onerror = () => {
      es.close();
      if (!doneRef.current) {
        setState((prev) => ({
          ...prev,
          connectionLost: true,
        }));
      }
    };

    return () => {
      es.close();
    };
  }, [slug, enabled]);

  return state;
}

import type { components } from "@repo/core";
import { useEffect, useRef, useState } from "react";

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
export function useSearchStream(slug: string): SearchStreamState {
  const [state, setState] = useState<SearchStreamState>({
    status: "idle",
    step: null,
    results: null,
    connectionLost: false,
  });

  const esRef = useRef<EventSource | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!slug) return;

    doneRef.current = false;

    const baseUrl =
      (import.meta.env.VITE_API_URL as string | undefined) ||
      "http://localhost:8000";

    const es = new EventSource(`${baseUrl}/search/${slug}/stream`);
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
  }, [slug]);

  return state;
}

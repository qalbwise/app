import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNetworkState } from "react-use";
import { toast } from "sonner";
import { containsOffensiveContent } from "@/lib/forbidden-words";
import { useCreateSearch } from "@/modules/search/queries/use-search";

export const Route = createFileRoute("/")({ component: Home });

const TOPIC_CHIPS = [
  "grief",
  "anxiety",
  "gratitude",
  "new beginning",
  "fear of failure",
  "patience",
] as const;

function Home() {
  const [topic, setTopic] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const createSearch = useCreateSearch();
  const network = useNetworkState();
  const online = network.online ?? true;

  async function handleSearch(searchTopic: string) {
    const trimmed = searchTopic.trim();
    if (!trimmed) return;

    if (!online) {
      toast.error("Search unavailable offline");
      return;
    }

    setSearchError(null);

    if (containsOffensiveContent(trimmed)) {
      toast.error(
        "Search contains inappropriate language. Please try another topic."
      );
      return;
    }

    try {
      const result = await createSearch.mutateAsync(trimmed);
      const slug = (result as { data?: { slug?: string } }).data?.slug;
      const cached = Boolean(
        (result as { data?: { cached?: boolean } }).data?.cached
      );
      if (slug) {
        if (cached) {
          sessionStorage.setItem(`search-cache-hit-${slug}`, "1");
        } else {
          sessionStorage.removeItem(`search-cache-hit-${slug}`);
        }
        navigate({ to: "/search/$slug", params: { slug } });
      } else {
        setSearchError("Could not start search. Please try again.");
      }
    } catch (error) {
      if ((error as any)?.response?.status === 400) {
        toast.error(
          (error as any)?.response?.data?.detail ||
            "Search contains inappropriate language."
        );
      } else if ((error as any)?.response?.status === 429) {
        const retryAfter = (error as any)?.response?.headers?.["retry-after"];
        toast.error(
          `Rate limit exceeded. Try again in ${retryAfter || "a few"} minutes.`
        );
      } else {
        setSearchError(
          "Search failed. Please check your connection and try again."
        );
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchError(null);
    handleSearch(topic);
  }

  const isLoading = createSearch.isPending;
  const hasOffensiveContent = containsOffensiveContent(topic);
  const isDisabled = isLoading || !online;

  return (
    <div
      className="flex min-h-[calc(100vh-56px-80px)] flex-col items-center justify-center px-4 py-20"
      style={{ background: "#fff" }}
    >
      {/* Hero text */}
      <div className="fade-up mx-auto max-w-2xl text-center">
        <p
          className="mb-4 font-semibold text-[12px] uppercase tracking-widest"
          style={{ color: "#777169", letterSpacing: "0.12em" }}
        />

        <h1 className="display-hero mb-5">What's on your qalb today?</h1>

        <p
          className="mb-12 text-[18px] leading-relaxed"
          style={{
            color: "#4e4e4e",
            fontWeight: 400,
            letterSpacing: "0.18px",
            maxWidth: "480px",
            margin: "0 auto 48px",
          }}
        >
          Discover what the Quran says about anything in your life — grief,
          fear, ambition, gratitude.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Type anything on your mind…"
              disabled={isDisabled}
              className="w-full rounded-full py-4 pr-36 pl-6 text-[15px] outline-none transition-all placeholder:text-[#b0ada8]"
              style={{
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "var(--shadow-outline)",
                background: "#ffffff",
                color: "#000",
                letterSpacing: "0.15px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "rgba(0,0,0,0.1) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-outline)";
              }}
            />
            <button
              type="submit"
              disabled={isDisabled || !topic.trim() || hasOffensiveContent}
              className="pill-btn-black absolute top-1/2 right-2 -translate-y-1/2 text-[14px]"
              style={{ height: "34px", padding: "0 18px" }}
              title={
                hasOffensiveContent
                  ? "Inappropriate language detected"
                  : !online
                    ? "Offline"
                    : ""
              }
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Searching…
                </span>
              ) : !online ? (
                "Offline"
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        {/* Inline search error */}
        {searchError && (
          <p
            className="mb-4 text-[13px]"
            style={{ color: "#dc2626", letterSpacing: "0.13px" }}
          >
            {searchError}
          </p>
        )}

        {/* Topic chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {TOPIC_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setSearchError(null);
                handleSearch(chip);
              }}
              disabled={isDisabled}
              className="warm-btn"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Subtle tagline */}
      <p
        className="mt-20 text-center text-[13px]"
        style={{ color: "#b0ada8", maxWidth: "320px", lineHeight: 1.6 }}
      >
        "There truly is a reminder in this for whoever has a heart."
        <br />
        <em style={{ color: "#c8c4bf" }}>— Quran 50:37</em>
      </p>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNetworkState } from "react-use";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { containsOffensiveContent } from "@/lib/forbidden-words";
import { useCreateSearch } from "@/modules/search/queries/use-search";

export const Route = createFileRoute("/")({ component: Home });

const TOPIC_CHIPS = [
  "Grief",
  "Anxiety",
  "Gratitude",
  "New Beginning",
  "Fear of Failure",
  "Patience",
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

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchError(null);
    handleSearch(topic);
  }

  const isLoading = createSearch.isPending;
  const hasOffensiveContent = containsOffensiveContent(topic);
  const isDisabled = isLoading || !online;

  return (
    <>
      <section className="flex flex-col items-center gap-4 text-pretty text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl">
          What is in your <span className="dark:text-gold">qalb</span> today?
        </h1>
        <p className="max-w-xl font-light">
          Discover what the Quran, sunnahs & tafsir relates to what your qalb
          currently feels.{" "}
          <span className="dark:text-gold">
            Grief, fear, ambition, gratitude.
          </span>
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <form className="flex w-full justify-center">
          <InputGroup className="h-18 w-full rounded-full px-4 py-6 md:w-175">
            <InputGroupInput
              placeholder="Type anything on your mind..."
              className="rounded-4xl placeholder:text-sm"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                variant="default"
                className="size-9.5 rounded-full text-sm md:w-26.5"
              >
                <Search />
                <span className="hidden md:inline">Search</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <ul className="flex flex-wrap justify-center gap-2 lg:gap-4">
          {TOPIC_CHIPS.map((topic) => (
            <li key={topic} className="inline-block">
              <Button variant="outline" className="text-sm">
                {topic}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* TODO: Create a static list of verses and randomize it */}
      <section className="mt-12 text-balance text-center font-sans text-muted-foreground text-sm">
        <p>"There truly is a reminder in this for whoever has a heart."</p>
        <p className="mt-2 italic">~ Quran 50:37</p>
      </section>
    </>
  );
}

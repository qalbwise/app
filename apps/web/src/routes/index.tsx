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
import { useCreateSearch } from "@/modules/search/data/mutations";

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

    if (containsOffensiveContent(trimmed)) {
      toast.warning(
        "Search contains inappropriate language. Please try another topic."
      );
      return;
    }

    try {
      const result = await createSearch.mutateAsync({ topic: trimmed });
      if (result.slug) {
        if (result.cached) {
          sessionStorage.setItem(`search-cache-hit-${result.slug}`, "1");
        } else {
          sessionStorage.removeItem(`search-cache-hit-${result.slug}`);
        }
        navigate({ to: "/search/$slug", params: { slug: result.slug } });
      } else {
        toast.error("Could not start search. Please try again.");
      }
    } catch {
      toast.error("Search failed. Please check your connection and try again.");
    }
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSearch(topic);
  }

  const isLoading = createSearch.isPending;
  const isDisabled = isLoading || !online;

  return (
    <>
      <section className="flex flex-col items-center gap-4 text-pretty text-center sm:mt-19 md:mt-23 lg:mt-31">
        <h1 className="text-3xl sm:text-4xl md:text-5xl">
          What is in your <span className="text-primary">qalb</span> today?
        </h1>
        <p className="max-w-xl font-light">
          Discover what the Quran, sunnahs & tafsir relates to what your qalb
          currently feels.{" "}
          <span className="text-primary">
            Grief, fear, ambition, gratitude.
          </span>
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <form className="flex w-full justify-center" onSubmit={handleSubmit}>
          <InputGroup className="h-18 w-full rounded-full px-4 py-6 md:w-175">
            <InputGroupInput
              placeholder="Type anything on your mind..."
              className="rounded-4xl placeholder:text-sm"
              autoComplete="off"
              value={topic}
              onChange={(event) => {
                setTopic(event.target.value);
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                variant="default"
                className="size-9.5 rounded-full text-sm md:w-26.5"
                disabled={isDisabled}
              >
                <Search />
                <span className="hidden md:inline">Search</span>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <ul className="flex flex-wrap justify-center gap-2 lg:gap-4">
          {TOPIC_CHIPS.map((chipTopic) => (
            <li key={chipTopic} className="inline-block">
              <Button
                type="button"
                variant="outline"
                className="text-sm"
                onClick={() => {
                  setTopic(chipTopic);
                  toast.dismiss();
                }}
              >
                {chipTopic}
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

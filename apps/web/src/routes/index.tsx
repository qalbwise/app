import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { useNetworkState } from "react-use";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { duration, easing, variants } from "@/lib/motions";
import { getRandomVerse } from "@/lib/utils";
import { useCreateSearch } from "@/modules/search/data/mutations";
import { containsOffensiveContent } from "@/modules/search/lib/forbidden-words";

export const Route = createFileRoute("/")({ component: Home });

const TOPIC_CHIPS = [
  "Grief",
  "Anxiety",
  "Gratitude",
  "New Beginning",
  "Fear of Failure",
  "Patience",
] as const;
const verse = getRandomVerse();

function Home() {
  const navigate = useNavigate();
  const createSearch = useCreateSearch();
  const network = useNetworkState();
  const inputRef = useRef<HTMLInputElement>(null);
  const online = network.online ?? true;

  async function handleSearch(raw: string) {
    const trimmed = raw.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
    if (!trimmed) return;

    if (!online) {
      toast.error("Search unavailable offline");
      return;
    }

    if (trimmed.length < 3) {
      toast.error("Search must be at least 3 characters");
      return;
    }
    if (trimmed.length > 70) {
      toast.error("Search must be less than 70 characters");
      return;
    }
    if (containsOffensiveContent(trimmed)) {
      toast.warning(
        "Search contains inappropriate language. Please try another topic."
      );
      return;
    }

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
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSearch(inputRef.current?.value ?? "");
  }

  const isLoading = createSearch.isPending;
  const isDisabled = isLoading || !online;

  return (
    <>
      <motion.section
        variants={variants.staggerContainer}
        initial="initial"
        animate="animate"
        className="mt-[5svh] flex flex-col items-center gap-4 text-pretty text-center sm:mt-[10svh] md:mt-[16svh] lg:mt-[20svh]"
      >
        <motion.h1
          variants={variants.staggerItem}
          className="text-3xl sm:text-4xl md:text-5xl"
        >
          What is in your <span className="text-primary">qalb</span> today?
        </motion.h1>
        <motion.p
          variants={variants.staggerItem}
          className="max-w-xl font-light"
        >
          Discover what the Quran, sunnahs & tafsir relates to what your qalb
          currently feels.{" "}
          <span className="text-primary">
            Grief, fear, ambition, gratitude.
          </span>
        </motion.p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: duration.normal, ease: easing.out }}
        className="mt-12 space-y-4"
      >
        <form className="flex w-full justify-center" onSubmit={handleSubmit}>
          <InputGroup className="h-18 w-full rounded-full bg-background px-4 py-6 md:w-175">
            <InputGroupInput
              ref={inputRef}
              placeholder="Type anything on your mind..."
              className="rounded-4xl placeholder:text-sm"
              autoComplete="off"
              defaultValue=""
              maxLength={70}
              onChange={(e) => {
                const sanitized = e.target.value.replace(
                  /[^\p{L}\p{N}\s]/gu,
                  ""
                );
                if (sanitized !== e.target.value) {
                  e.target.value = sanitized;
                }
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

        <motion.ul
          variants={variants.staggerContainerSlow}
          initial="initial"
          animate="animate"
          className="flex flex-wrap justify-center gap-2 lg:gap-4"
        >
          {TOPIC_CHIPS.map((chipTopic) => (
            <motion.li
              key={chipTopic}
              variants={variants.staggerItem}
              className="inline-block"
            >
              <Button
                type="button"
                variant="outline"
                className="text-sm"
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.value = chipTopic;
                  }
                  toast.dismiss();
                }}
              >
                {chipTopic}
              </Button>
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: duration.slow, ease: easing.out }}
        className="mt-12 text-balance text-center font-sans text-muted-foreground text-sm"
      >
        <p>"{verse.text}"</p>
        <p className="mt-2 italic">~ Quran {verse.reference}</p>
      </motion.section>
    </>
  );
}

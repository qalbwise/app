import type { components } from "@repo/core";
import { motion } from "motion/react";
import { variants } from "@/lib/motions";
import { VerseCard } from "@/modules/search/components/verse-card";

type VerseResult = components["schemas"]["VerseResult"];

interface SearchResultsListProps {
  visibleResults: VerseResult[];
  slug: string;
  pageStart: number;
  onSaveRequest: (ayahKey: string) => void;
}

export function SearchResultsList({
  visibleResults,
  slug,
  pageStart,
  onSaveRequest,
}: SearchResultsListProps) {
  return (
    <motion.div
      variants={variants.staggerContainer}
      initial="initial"
      animate="animate"
      className="relative mt-8"
    >
      <div className="pointer-events-none absolute inset-x-3 top-0 h-12 bg-linear-to-b from-card to-transparent sm:inset-x-6" />
      <div className="pointer-events-none absolute inset-x-3 bottom-0 h-14 bg-linear-to-t from-card to-transparent sm:inset-x-6" />

      {visibleResults.map((verse, index) => (
        <motion.div key={verse.ayah_key} variants={variants.staggerItem}>
          <VerseCard
            verse={verse}
            rank={pageStart + index}
            slug={slug}
            onSaveRequest={onSaveRequest}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

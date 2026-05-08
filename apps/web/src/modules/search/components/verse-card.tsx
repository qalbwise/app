import type { components } from "@repo/core";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateBookmark } from "@/modules/bookmarks/queries/use-bookmarks";
import {
  useExplainVerse,
  useVersePage,
} from "@/modules/search/queries/use-search";

type VerseResult = components["schemas"]["VerseResult"];

interface VerseCardProps {
  verse: VerseResult;
  /** 0-indexed rank — drives opacity */
  rank: number;
  /** Search slug — needed to fetch per-verse explanation */
  slug: string;
  /** Called when user taps "Save verse" while unauthenticated */
  onSaveRequest?: (ayahKey: string) => void;
}

const RANK_OPACITIES = [1, 1, 1, 1, 1] as const;

/** English locale; MCP/API may still store `/ur/` or other paths in `url`. */
function quranComEnUrl(ayahKey: string): string {
  const raw = ayahKey.trim();
  const parts = raw.split(":");
  if (parts.length !== 2) return "https://quran.com/en";
  const surah = Number.parseInt(parts[0]!, 10);
  const ayah = Number.parseInt(parts[1]!, 10);
  if (Number.isNaN(surah) || Number.isNaN(ayah)) return "https://quran.com/en";
  return `https://quran.com/en/${surah}/${ayah}`;
}

export const VerseCard = ({
  verse,
  rank,
  slug,
  onSaveRequest,
}: VerseCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchedWhyText, setFetchedWhyText] = useState<string | null>(null);

  const cardOpacity = RANK_OPACITIES[rank] ?? 0.46;
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));

  const versePage = useVersePage(slug, rank + 1, showTafsir);

  const createBookmark = useCreateBookmark();

  const loadedVerse = versePage.data?.data?.verse;
  const whyText =
    verse.why_this_verse ?? loadedVerse?.why_this_verse ?? fetchedWhyText;
  const tafsirText = loadedVerse?.tafsir_excerpt ?? verse.tafsir_excerpt;
  const tafsirAuthor = loadedVerse?.tafsir_author ?? verse.tafsir_author;

  const explainVerse = useExplainVerse(slug, rank + 1, expanded && !whyText);
  const isLoadingWhyText = expanded && !whyText && explainVerse.isPending;

  useEffect(() => {
    if (
      explainVerse.isSuccess &&
      explainVerse.data?.data &&
      typeof explainVerse.data.data.why_this_verse === "string"
    ) {
      setFetchedWhyText(explainVerse.data.data.why_this_verse);
    }
  }, [explainVerse.isSuccess, explainVerse.data]);

  async function handleSave() {
    if (!isLoggedIn) {
      onSaveRequest?.(verse.ayah_key);
      return;
    }
    if (saved || createBookmark.isPending) return;

    if (!navigator.onLine) {
      toast.error("Sync when back online");
      return;
    }

    try {
      await createBookmark.mutateAsync({
        ayah_key: verse.ayah_key,
        surah_name: verse.surah_name,
        arabic_text: verse.arabic_text,
        translation: verse.translation,
      });
      setSaved(true);
    } catch {
      /* silently ignore duplicate / network errors for now */
    }
  }

  async function handleShare() {
    const text = `"${verse.translation}" — ${verse.surah_name} (${verse.ayah_key}) via Qalbwise`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text, url: window.location.href });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function toggleExpand() {
    setExpanded((v) => !v);
    if (!expanded) setShowTafsir(false);
  }

  return (
    <article
      className="card-surface overflow-hidden transition-all duration-200"
      style={{ opacity: cardOpacity }}
    >
      <div className="p-6">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="mb-4 flex items-center gap-2">
          <span className="font-semibold text-[13px] text-foreground">
            {verse.surah_name}
          </span>
          <span className="rounded-full border border-[rgba(78,50,23,0.1)] bg-(--clr-warm-stone) px-2 py-0.5 font-medium text-[12px] text-muted-foreground">
            {verse.ayah_key}
          </span>
        </div>

        {/* ── Arabic text ─────────────────────────────────── */}
        <div className="arabic-text mb-4">{verse.arabic_text}</div>

        {/* ── Translation ─────────────────────────────────── */}
        <p className="mb-5 text-[15px] text-secondary-foreground not-italic leading-relaxed">
          {verse.translation}
        </p>

        {/* ── Action row ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <ActionChip
            active={expanded}
            onClick={toggleExpand}
            label={expanded ? "Why this verse ↑" : "Why this verse ↓"}
          />
          <ActionChip
            active={showTafsir}
            onClick={() => {
              setShowTafsir((v) => !v);
              if (!expanded) setExpanded(true);
            }}
            label="Read tafsir"
          />
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className={cn(
              "rounded-full px-3 py-1 font-medium text-[12px] transition-all",
              copied
                ? "bg-(--clr-warm-stone-solid) text-foreground"
                : "bg-transparent text-muted-foreground"
            )}
          >
            {copied ? "Copied!" : "Share"}
          </button>
          {/* quran.com */}
          <a
            href={quranComEnUrl(verse.ayah_key)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border px-3 py-1 font-medium text-[12px] text-muted-foreground no-underline transition-colors hover:text-secondary-foreground"
          >
            quran.com ↗
          </a>

          {/* Save — pushed to far right */}
          <button
            type="button"
            onClick={handleSave}
            disabled={createBookmark.isPending}
            className={cn(
              "ml-auto rounded-full px-3 py-1 font-medium text-[12px] transition-all disabled:opacity-40",
              saved
                ? "cursor-default border border-[rgba(78,50,23,0.2)] bg-(--clr-warm-stone) text-foreground"
                : "cursor-pointer border border-border bg-transparent text-secondary-foreground hover:border-foreground hover:text-foreground"
            )}
          >
            {saved
              ? "✓ Saved"
              : createBookmark.isPending
                ? "Saving…"
                : "Save verse"}
          </button>
        </div>
      </div>

      {/* ── Expanded section ───────────────────────────────── */}
      {expanded && (
        <div className="border-black/6 border-t px-6 py-5">
          {/* Why this verse */}
          <div className="mb-5">
            <p className="mb-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
              Why this verse
            </p>
            {isLoadingWhyText ? (
              <LoadingDots />
            ) : whyText ? (
              <p className="text-[14px] text-secondary-foreground leading-relaxed">
                {whyText}
              </p>
            ) : (
              <p className="text-(--clr-placeholder) text-[14px]">
                Explanation not available for this verse.
              </p>
            )}
          </div>

          {/* Tafsir */}
          {showTafsir && (
            <div className="border-black/6 border-t pt-5">
              <p className="mb-2 font-semibold text-[11px] text-muted-foreground uppercase tracking-widest">
                Tafsir
                {tafsirAuthor && (
                  <span className="ml-1.5 text-(--clr-placeholder) normal-case">
                    · {tafsirAuthor}
                  </span>
                )}
              </p>
              {versePage.isPending ? (
                <LoadingDots />
              ) : tafsirText ? (
                <p className="text-[14px] text-secondary-foreground leading-relaxed">
                  {tafsirText}
                </p>
              ) : (
                <p className="text-(--clr-placeholder) text-[14px]">
                  Tafsir not available for this verse.
                </p>
              )}
            </div>
          )}

          {/* Login nudge for unauthenticated users */}
          {!isLoggedIn && (
            <div className="mt-5 rounded-xl bg-[rgba(245,242,239,0.6)] px-4 py-3">
              <p className="text-[13px] text-muted-foreground">
                Create a free account to build your personal Quran journal.
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

const ActionChip = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 font-medium text-[12px] transition-all ${
      active
        ? "border-black/15 bg-(--clr-warm-stone-solid) text-foreground"
        : "border-border bg-transparent text-secondary-foreground"
    }`}
  >
    {label}
  </button>
);

const LoadingDots = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-(--clr-subtle)"
        style={{
          animation: `skeleton-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </div>
);

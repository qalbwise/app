import type { components } from "@repo/core";
import { useState } from "react";
import { useCreateBookmark } from "@/modules/bookmarks/queries/use-bookmarks";
import {
  useTafsir,
  useVerseExplain,
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

const RANK_OPACITIES = [1, 0.85, 0.7, 0.58, 0.46] as const;

const RANK_DOT_COLORS = [
  ["#000", "#4e4e4e", "#e5e5e5"],
  ["#4e4e4e", "#777169", "#e5e5e5"],
  ["#777169", "#e5e5e5", "#e5e5e5"],
  ["#b0ada8", "#e5e5e5", "#e5e5e5"],
  ["#e5e5e5", "#e5e5e5", "#e5e5e5"],
] as const;

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

  const cardOpacity = RANK_OPACITIES[rank] ?? 0.46;
  const dotColors = RANK_DOT_COLORS[rank] ?? RANK_DOT_COLORS[4];
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));

  const needsExplain = expanded && !verse.why_this_verse;
  const explain = useVerseExplain(slug, verse.ayah_key, needsExplain);
  const tafsir = useTafsir(verse.ayah_key, showTafsir);

  const createBookmark = useCreateBookmark();

  const whyText =
    verse.why_this_verse ?? explain.data?.data?.why_this_verse ?? null;

  async function handleSave() {
    if (!isLoggedIn) {
      onSaveRequest?.(verse.ayah_key);
      return;
    }
    if (saved || createBookmark.isPending) return;

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
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-[13px] font-semibold"
              style={{ color: "#000" }}
            >
              {verse.surah_name}
            </span>
            <span
              className="text-[12px] font-medium"
              style={{
                color: "#777169",
                background: "rgba(245,242,239,0.8)",
                padding: "2px 8px",
                borderRadius: "9999px",
                border: "1px solid rgba(78,50,23,0.1)",
              }}
            >
              {verse.ayah_key}
            </span>
          </div>

          {/* Ranking dots */}
          <div className="flex items-center gap-1">
            {dotColors.map((color, i) => (
              <div
                key={i}
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        {/* ── Arabic text ─────────────────────────────────── */}
        <div className="arabic-text mb-4">{verse.arabic_text}</div>

        {/* ── Translation ─────────────────────────────────── */}
        <p
          className="mb-5 text-[15px] leading-relaxed"
          style={{
            color: "#4e4e4e",
            fontStyle: "italic",
            letterSpacing: "0.15px",
          }}
        >
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
            className="text-[12px] font-medium transition-all"
            style={{
              padding: "5px 12px",
              borderRadius: "9999px",
              border: "1px solid #e5e5e5",
              color: copied ? "#000" : "#777169",
              background: copied ? "#f5f2ef" : "transparent",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Share"}
          </button>
          {/* quran.com */}
          <a
            href={verse.url}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-medium no-underline transition-colors"
            style={{
              color: "#777169",
              padding: "5px 12px",
              border: "1px solid #e5e5e5",
              borderRadius: "9999px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4e4e4e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#777169")}
          >
            quran.com ↗
          </a>

          {/* Save — pushed to far right */}
          <button
            type="button"
            onClick={handleSave}
            disabled={createBookmark.isPending}
            className="ml-auto text-[12px] font-medium transition-all disabled:opacity-40"
            style={{
              padding: "5px 12px",
              border: `1px solid ${saved ? "rgba(78,50,23,0.2)" : "#e5e5e5"}`,
              borderRadius: "9999px",
              color: saved ? "#000" : "#4e4e4e",
              background: saved ? "rgba(245,242,239,0.8)" : "transparent",
              cursor: saved ? "default" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!saved) {
                e.currentTarget.style.borderColor = "#000";
                e.currentTarget.style.color = "#000";
              }
            }}
            onMouseLeave={(e) => {
              if (!saved) {
                e.currentTarget.style.borderColor = "#e5e5e5";
                e.currentTarget.style.color = "#4e4e4e";
              }
            }}
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
        <div
          className="border-t px-6 py-5"
          style={{ borderColor: "rgba(0,0,0,0.06)" }}
        >
          {/* Why this verse */}
          <div className="mb-5">
            <p
              className="mb-2 text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "#777169" }}
            >
              Why this verse
            </p>
            {explain.isPending && needsExplain ? (
              <LoadingDots />
            ) : whyText ? (
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "#4e4e4e", letterSpacing: "0.14px" }}
              >
                {whyText}
              </p>
            ) : (
              <p className="text-[14px]" style={{ color: "#b0ada8" }}>
                Explanation not available for this verse.
              </p>
            )}
          </div>

          {/* Tafsir */}
          {showTafsir && (
            <div
              className="border-t pt-5"
              style={{ borderColor: "rgba(0,0,0,0.06)" }}
            >
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "#777169" }}
              >
                Tafsir
                {tafsir.data?.data?.source && (
                  <span
                    className="ml-1.5 normal-case"
                    style={{ color: "#b0ada8" }}
                  >
                    · {tafsir.data.data.source}
                  </span>
                )}
              </p>
              {tafsir.isPending ? (
                <LoadingDots />
              ) : tafsir.data?.data?.tafsir ? (
                <p
                  className="text-[14px] leading-relaxed"
                  style={{ color: "#4e4e4e", letterSpacing: "0.14px" }}
                >
                  {tafsir.data.data.tafsir}
                </p>
              ) : (
                <p className="text-[14px]" style={{ color: "#b0ada8" }}>
                  Tafsir not available for this verse.
                </p>
              )}
            </div>
          )}

          {/* Login nudge for unauthenticated users */}
          {!isLoggedIn && (
            <div
              className="mt-5 rounded-xl px-4 py-3"
              style={{ background: "rgba(245,242,239,0.6)" }}
            >
              <p className="text-[13px]" style={{ color: "#777169" }}>
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
    className="text-[12px] font-medium transition-all"
    style={{
      padding: "5px 12px",
      borderRadius: "9999px",
      border: "1px solid",
      borderColor: active ? "rgba(0,0,0,0.15)" : "#e5e5e5",
      background: active ? "#f5f2ef" : "transparent",
      color: active ? "#000" : "#4e4e4e",
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

const LoadingDots = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: "#c8c4bf",
          animation: `skeleton-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </div>
);

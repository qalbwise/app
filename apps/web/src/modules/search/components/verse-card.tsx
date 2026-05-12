import type { components } from "@repo/core";
import { BookOpenCheck, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { toast } from "sonner";
import { Dots } from "@/components/loading-ui/dots";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { useCreateBookmark } from "@/modules/bookmarks/data/mutations";
import { ReadingSettingsSidebar } from "@/modules/preferences/components/reading-settings-sidebar";
import { useExplainVerse, useVersePage } from "@/modules/search/data/queries";

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
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchedWhyText, setFetchedWhyText] = useState<string | null>(null);
  const [copyToClipboardState, copyToClipboard] = useCopyToClipboard();

  const { isLoggedIn } = useAuth();

  const versePage = useVersePage(slug, rank + 1, true);
  const createBookmark = useCreateBookmark();

  const loadedVerse = versePage.data?.verse;
  const whyText =
    verse.why_this_verse ?? loadedVerse?.why_this_verse ?? fetchedWhyText;
  const tafsirText = loadedVerse?.tafsir_excerpt ?? verse.tafsir_excerpt;
  const tafsirAuthor = loadedVerse?.tafsir_author ?? verse.tafsir_author;

  const explainVerse = useExplainVerse(slug, rank + 1, true);

  useEffect(() => {
    const explanation = explainVerse.data?.why_this_verse;
    if (explainVerse.isSuccess && typeof explanation === "string") {
      setFetchedWhyText(explanation);
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

  function handleShare() {
    const text = `"${verse.translation}" — ${verse.surah_name} (${verse.ayah_key}) via Qalbwise`;
    if (typeof navigator.share === "function") {
      navigator.share({ text, url: window.location.href }).catch(() => {
        /* user cancelled — fall through to clipboard */
      });
      return;
    }
    copyToClipboard(text);
    if (copyToClipboardState.error) {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="max-h-[60svh] overflow-y-auto py-8 font-sans sm:px-7">
      {/* Header */}
      <CardHeader className="flex flex-col items-center gap-4 italic">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <h1 className="font-medium text-xl">{verse.surah_name}</h1>

          <span className="rounded-3xl border border-border bg-secondary px-3 py-1 font-medium">
            {verse.ayah_key}
          </span>
        </div>

        <a
          href={quranComEnUrl(verse.ayah_key)}
          target="_blank"
          rel="noreferrer noopener"
          className="text-center text-secondary-foreground underline transition-all hover:text-muted-foreground"
        >
          quran.com reference
        </a>
      </CardHeader>

      <CardContent className="space-y-8 pt-4">
        <Separator />

        {/* Verse content */}
        <div className="flex flex-col items-stretch gap-4 text-center">
          <span className="text-[32px]">{verse.arabic_text}</span>
          <span>{verse.translation}</span>

          {/* Action buttons */}
          <div className="flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              onClick={handleShare}
              className={cn(copied && "bg-secondary text-foreground")}
            >
              {copied ? "Copied!" : "Share"}
              <Share2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSave}
              disabled={createBookmark.isPending}
              className={cn(saved && "bg-secondary text-foreground")}
            >
              {saved
                ? "✓ Saved"
                : createBookmark.isPending
                  ? "Saving…"
                  : "Save Verse"}
              <BookOpenCheck className="size-4" />
            </Button>
            <ReadingSettingsSidebar />
          </div>
        </div>

        <Separator />

        {/* Why this verse */}
        <div className="space-y-1 text-xs lg:text-sm">
          <h2 className="font-medium text-muted-foreground">Why this verse</h2>
          {explainVerse.isPending ? (
            <Dots className="size-6 py-1 text-muted-foreground" />
          ) : whyText ? (
            <p className="leading-relaxed">{whyText}</p>
          ) : (
            <p className="text-muted-foreground">
              Explanation not available for this verse.
            </p>
          )}
        </div>

        <Separator />

        {/* Tafsir */}
        <div className="space-y-1 text-xs lg:text-sm">
          <h2 className="font-medium text-muted-foreground">
            Tafsir
            {tafsirAuthor && (
              <span className="ml-2 text-muted-foreground">
                · {tafsirAuthor}
              </span>
            )}
          </h2>
          {versePage.isPending ? (
            <Dots className="size-6 py-1 text-muted-foreground" />
          ) : tafsirText ? (
            <p className="leading-6 tracking-[0.18px]">{tafsirText}</p>
          ) : (
            <p className="text-muted-foreground">
              Tafsir not available for this verse.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

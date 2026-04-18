import type { components } from "@repo/core";

export type ArabicFontId =
  components["schemas"]["UserPreferences"]["arabic_font"];

/** Display labels match product naming; stacks use web-safe Quran-oriented families. */
export const ARABIC_FONT_STACK: Record<ArabicFontId, string> = {
  hafs_quran:
    '"Scheherazade New", "Amiri", "Traditional Arabic", "Arabic Typesetting", serif',
  indopak:
    '"Noto Naskh Arabic", "Scheherazade New", "Amiri", "Traditional Arabic", serif',
};

export const ARABIC_SCRIPT_OPTIONS: { id: ArabicFontId; label: string }[] = [
  { id: "hafs_quran", label: "Hafs Arabic & Quran Font" },
  { id: "indopak", label: "Indopak" },
];

import type { components } from "@repo/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ArabicFontId = components["schemas"]["UserPreferences"]["arabic_font"];

type FontPreferencesState = {
  serif: boolean;
  arabicFont: ArabicFontId;
  /** Step 3–12; step 7 matches default body size (see `--arabic-text-size`). */
  arabicSizeStep: number;
  setSerif: (serif: boolean) => void;
  setArabicFont: (font: ArabicFontId) => void;
  setArabicSizeStep: (step: number) => void;
  hydrateFromServer: (prefs: components["schemas"]["UserPreferences"]) => void;
  resetReadingPreferences: () => void;
};

export const useFontPreferencesStore = create<FontPreferencesState>()(
  persist(
    (set) => ({
      serif: false,
      arabicFont: "hafs_quran",
      arabicSizeStep: 7,
      setSerif: (serif) => set({ serif }),
      setArabicFont: (arabicFont) => set({ arabicFont }),
      setArabicSizeStep: (arabicSizeStep) =>
        set({ arabicSizeStep: Math.min(12, Math.max(3, arabicSizeStep)) }),
      hydrateFromServer: (prefs) =>
        set({
          serif: prefs.serif,
          arabicFont: prefs.arabic_font,
        }),
      resetReadingPreferences: () =>
        set({
          serif: false,
          arabicFont: "hafs_quran",
          arabicSizeStep: 7,
        }),
    }),
    { name: "qalbwise-font-prefs" }
  )
);

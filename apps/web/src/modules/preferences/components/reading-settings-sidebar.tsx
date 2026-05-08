import { Minus, Plus, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUpdatePreferences } from "@/modules/preferences/hooks/use-update-preferences";
import type { ArabicFontId } from "@/modules/preferences/lib/arabic-font-stacks";
import { ARABIC_SCRIPT_OPTIONS } from "@/modules/preferences/lib/arabic-font-stacks";
import { useFontPreferencesStore } from "@/modules/preferences/stores/font-preferences-store";

const LATIN_TYPE_OPTIONS: { serif: boolean; label: string }[] = [
  { serif: false, label: "Sans" },
  { serif: true, label: "Serif" },
];

const sectionLabelClass =
  "mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground";

const segmentTrackClass =
  "flex rounded-full p-1 bg-muted shadow-[inset_rgba(0,0,0,0.06)_0_0_0_0.5px]";

function segmentOptionClass(selected: boolean) {
  return cn(
    "flex-1 rounded-full px-2 py-2.5 text-center font-medium text-[13px] transition-all duration-150",
    "font-[family-name:var(--font-sans)] tracking-[0.01em]",
    selected
      ? "bg-white text-black shadow-[rgba(0,0,0,0.06)_0_0_0_1px,rgba(0,0,0,0.04)_0_1px_2px,rgba(0,0,0,0.04)_0_2px_4px]"
      : "text-[#777169] hover:text-[#4e4e4e]"
  );
}

function isLoggedIn() {
  return Boolean(localStorage.getItem("access_token"));
}

export const ReadingSettingsSidebar = () => {
  const [open, setOpen] = useState(false);

  const serif = useFontPreferencesStore((s) => s.serif);
  const arabicFont = useFontPreferencesStore((s) => s.arabicFont);
  const arabicSizeStep = useFontPreferencesStore((s) => s.arabicSizeStep);
  const setSerif = useFontPreferencesStore((s) => s.setSerif);
  const setArabicFont = useFontPreferencesStore((s) => s.setArabicFont);
  const setArabicSizeStep = useFontPreferencesStore((s) => s.setArabicSizeStep);
  const resetReadingPreferences = useFontPreferencesStore(
    (s) => s.resetReadingPreferences
  );

  const updatePreferences = useUpdatePreferences();

  const syncToServer = useCallback(
    (next: { serif: boolean; arabic_font: ArabicFontId }) => {
      if (!isLoggedIn()) return;
      updatePreferences.mutate(next);
    },
    [updatePreferences]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleDone() {
    setOpen(false);
  }

  function handleReset() {
    resetReadingPreferences();
    if (isLoggedIn()) {
      updatePreferences.mutate({ serif: false, arabic_font: "hafs_quran" });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reading settings"
        className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:text-secondary-foreground"
      >
        <Settings className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-60">
          <button
            type="button"
            aria-label="Close settings"
            className="absolute inset-0 bg-[rgba(0,0,0,0.12)] backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside
            className={cn(
              "slide-in-from-right fade-in absolute inset-y-0 right-0 flex w-full max-w-105 animate-in flex-col",
              "border-[#e5e5e5] border-l bg-white duration-200",
              "shadow-[rgba(0,0,0,0.04)_-8px_0_24px]"
            )}
          >
            <header className="shrink-0 border-[rgba(0,0,0,0.05)] border-b px-6 pt-8 pb-5">
              <h2 className="font-(family-name:--font-display) font-light text-[24px] text-black leading-[1.17] tracking-[-0.02em]">
                Reading settings
              </h2>
              <p className="caption mt-2 max-w-[320px]">
                Typography for Arabic script, English text, and the interface.
              </p>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-8 pb-32">
              <div className="flex flex-col gap-8">
                <div>
                  <p
                    className={cn(
                      sectionLabelClass,
                      "normal-case tracking-normal"
                    )}
                  >
                    Preview
                  </p>
                  <div className="card-surface rounded-[20px] px-5 py-5 shadow-[rgba(0,0,0,0.06)_0px_0px_0px_1px,rgba(0,0,0,0.04)_0px_1px_2px,rgba(0,0,0,0.04)_0px_2px_4px]">
                    <p
                      className="mb-3 text-right text-[26px] text-foreground leading-[1.9]"
                      style={{
                        fontFamily: `var(--font-arabic), serif`,
                        fontSize: "var(--arabic-text-size, 22px)",
                      }}
                    >
                      بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
                    </p>
                    <p
                      className={cn(
                        "font-normal text-[#4e4e4e] text-[14px] leading-relaxed tracking-[0.14px]",
                        serif ? "font-serif" : "font-sans"
                      )}
                    >
                      In the Name of Allah—the Most Compassionate, Most
                      Merciful.
                    </p>
                  </div>
                </div>

                <div>
                  <p className={sectionLabelClass}>Script / font</p>
                  <div className={segmentTrackClass}>
                    {ARABIC_SCRIPT_OPTIONS.map((opt) => {
                      const selected = arabicFont === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setArabicFont(opt.id);
                            syncToServer({ serif, arabic_font: opt.id });
                          }}
                          className={segmentOptionClass(selected)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className={sectionLabelClass}>English & UI</p>
                  <div
                    className={segmentTrackClass}
                    role="group"
                    aria-label="Latin font for English and interface"
                  >
                    {LATIN_TYPE_OPTIONS.map((opt) => {
                      const selected = serif === opt.serif;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            setSerif(opt.serif);
                            syncToServer({
                              serif: opt.serif,
                              arabic_font: arabicFont,
                            });
                          }}
                          className={segmentOptionClass(selected)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="caption mt-2 text-[12px] leading-snug">
                    Applies to translations and UI body text.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-[13px] text-secondary-foreground tracking-[0.14px]">
                    Arabic font size
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Decrease Arabic font size"
                      onClick={() => setArabicSizeStep(arabicSizeStep - 1)}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl border-0 bg-white",
                        "text-black shadow-[rgba(0,0,0,0.4)_0px_0px_1px,rgba(0,0,0,0.04)_0px_4px_4px]",
                        "transition-shadow hover:shadow-[rgba(0,0,0,0.06)_0px_0px_0px_1px,rgba(0,0,0,0.06)_0px_4px_8px]"
                      )}
                    >
                      <Minus className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <span className="min-w-10 text-center font-medium text-[16px] text-black tabular-nums tracking-[0.16px]">
                      {arabicSizeStep}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase Arabic font size"
                      onClick={() => setArabicSizeStep(arabicSizeStep + 1)}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl border-0 bg-white",
                        "text-black shadow-[rgba(0,0,0,0.4)_0px_0px_1px,rgba(0,0,0,0.04)_0px_4px_4px]",
                        "transition-shadow hover:shadow-[rgba(0,0,0,0.06)_0px_0px_0px_1px,rgba(0,0,0,0.06)_0px_4px_8px]"
                      )}
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <footer className="absolute right-0 bottom-0 left-0 flex items-center justify-between gap-4 border-black/5 border-t bg-white px-6 py-5 shadow-[rgba(0,0,0,0.04)_0_-4px_12px_-4px]">
              <button
                type="button"
                onClick={handleReset}
                className="font-medium text-[14px] text-muted-foreground tracking-[0.14px] transition-colors hover:text-foreground"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="pill-btn-black h-10 px-7 text-[14px]"
              >
                Done
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
};

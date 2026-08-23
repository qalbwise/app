import { Minus, Plus, Settings } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/modules/auth/hooks/use-auth";
import { useUpdatePreferences } from "@/modules/preferences/hooks/use-update-preferences";
import type { ArabicFontId } from "@/modules/preferences/lib/arabic-font-stacks";
import { ARABIC_SCRIPT_OPTIONS } from "@/modules/preferences/lib/arabic-font-stacks";
import { useFontPreferencesStore } from "@/modules/preferences/stores/font-preferences-store";

const LATIN_TYPE_OPTIONS = [
  { serif: false, label: "Sans" },
  { serif: true, label: "Serif" },
];

export function ReadingSettingsSidebar() {
  const [open, setOpen] = useState(false);
  const { isLoggedIn } = useAuth();

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
      if (!isLoggedIn) return;
      updatePreferences.mutate(next);
    },
    [updatePreferences, isLoggedIn]
  );

  const handleReset = () => {
    resetReadingPreferences();
    if (isLoggedIn) {
      updatePreferences.mutate({ serif: false, arabic_font: "hafs_quran" });
    }
  };

  return (
    <Drawer open={open} autoFocus onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" size="lg">
          Settings
          <Settings className="size-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Reading settings</DrawerTitle>
          <DrawerDescription>
            Typography for Arabic script, English text, and the interface.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-8 px-6 py-8">
          <div>
            <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Preview
            </p>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <p
                className="mb-3 text-right text-[26px] leading-[1.9]"
                style={{
                  fontFamily: `var(--font-arabic), serif`,
                  fontSize: "var(--arabic-text-size, 22px)",
                }}
              >
                بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ
              </p>
              <p className={serif ? "font-serif" : "font-sans"}>
                In the Name of Allah—the Most Compassionate, Most Merciful.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Script / font
            </p>
            <p className="mb-4 text-pretty text-muted-foreground text-xs">
              Applies to Arabic script in the Quranic text.
            </p>
            <RadioGroup
              value={arabicFont}
              onValueChange={(value) => {
                if (value !== arabicFont) {
                  setArabicFont(value as ArabicFontId);
                  syncToServer({ serif, arabic_font: value as ArabicFontId });
                }
              }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              {ARABIC_SCRIPT_OPTIONS.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.id} id={opt.id} />
                  <label
                    htmlFor={opt.id}
                    className="cursor-pointer font-medium text-sm"
                  >
                    {opt.label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <p className="mb-2 font-medium text-muted-foreground text-sm uppercase tracking-wider">
              English & UI
            </p>
            <p className="mb-4 text-pretty text-muted-foreground text-xs">
              Applies to translations and UI body text.
            </p>
            <RadioGroup
              value={serif ? "serif" : "sans"}
              onValueChange={(value) => {
                const isSerif = value === "serif";
                setSerif(isSerif);
                syncToServer({ serif: isSerif, arabic_font: arabicFont });
              }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              {LATIN_TYPE_OPTIONS.map((opt) => {
                const value = opt.serif ? "serif" : "sans";
                return (
                  <div key={opt.label} className="flex items-center gap-2">
                    <RadioGroupItem value={value} id={value} />
                    <label
                      htmlFor={value}
                      className="cursor-pointer font-medium text-sm"
                    >
                      {opt.label}
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div>
            <p className="mb-2 font-medium text-secondary-foreground text-sm">
              Arabic font size
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setArabicSizeStep(arabicSizeStep - 1)}
                aria-label="Decrease Arabic font size"
                disabled={arabicSizeStep === 3}
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-10 text-center font-medium text-base tabular-nums">
                {arabicSizeStep}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setArabicSizeStep(arabicSizeStep + 1)}
                aria-label="Increase Arabic font size"
                disabled={arabicSizeStep === 12}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-row justify-between">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

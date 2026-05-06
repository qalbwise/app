import { useEffect } from "react";

import patternBottom from "@/assets/pattern-bottom.svg";
import patternTop from "@/assets/pattern-top.svg";
import patternX from "@/assets/pattern-x.svg";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PatternLayer } from "@/components/ui/pattern-layer";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { usePreferencesHydration } from "@/modules/preferences/hooks/use-preferences-hydration";
import { ARABIC_FONT_STACK } from "@/modules/preferences/lib/arabic-font-stacks";
import { useFontPreferencesStore } from "@/modules/preferences/stores/font-preferences-store";

const backgroundLayers = [
  {
    id: "pattern-top",
    color: "#e0e0e0",
    image: patternTop,
    position: "center -502px",
  },
  {
    id: "pattern-bottom",
    color: "#fafafa",
    image: patternBottom,
    position: "center 480px",
  },
  {
    id: "pattern-x-left",
    color: "var(--clr-warm-stone)",
    image: patternX,
    position: "-48px",
  },
  {
    id: "pattern-x-right",
    color: "var(--clr-warm-stone)",
    image: patternX,
    position: "calc(100% + 48px) 0",
  },
] as const;

export const RootLayout = ({ children }: { children: React.ReactNode }) => {
  usePreferencesHydration();
  const serif = useFontPreferencesStore((s) => s.serif);
  const arabicFont = useFontPreferencesStore((s) => s.arabicFont);
  const arabicSizeStep = useFontPreferencesStore((s) => s.arabicSizeStep);
  const setArabicFont = useFontPreferencesStore((s) => s.setArabicFont);

  useEffect(() => {
    const f = useFontPreferencesStore.getState().arabicFont;
    if (f !== "hafs_quran" && f !== "indopak") {
      setArabicFont("hafs_quran");
    }
  }, [setArabicFont]);

  useEffect(() => {
    const stack =
      arabicFont === "indopak"
        ? ARABIC_FONT_STACK.indopak
        : ARABIC_FONT_STACK.hafs_quran;
    document.documentElement.style.setProperty("--font-arabic", stack);
  }, [arabicFont]);

  useEffect(() => {
    const px = 22 + (arabicSizeStep - 7) * 2;
    document.documentElement.style.setProperty(
      "--arabic-text-size",
      `${Math.min(40, Math.max(14, px))}px`
    );
  }, [arabicSizeStep]);

  return (
    <div
      className={cn("relative flex min-h-svh flex-col", serif && "font-serif")}
    >
      {backgroundLayers.map((layer) => (
        <PatternLayer
          key={layer.id}
          id={layer.id}
          color={layer.color}
          image={layer.image}
          position={layer.position}
          className={
            layer.id.startsWith("pattern-x") ? "hidden md:block" : undefined
          }
        />
      ))}

      <div className="relative z-10 flex min-h-svh flex-col">
        <Header />
        <main
          id="main-content"
          className="main-wrap flex-1 items-center pt-24 pb-12 sm:pt-28 md:pt-32 lg:pt-40"
        >
          {children}
        </main>
        <Toaster />
        <Footer />
      </div>
    </div>
  );
};

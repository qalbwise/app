import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";

import "../styles.css";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { usePreferencesHydration } from "@/modules/preferences/hooks/use-preferences-hydration";
import { ARABIC_FONT_STACK } from "@/modules/preferences/lib/arabic-font-stacks";
import { useFontPreferencesStore } from "@/modules/preferences/stores/font-preferences-store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
});

export const Route = createRootRoute({
  component: RootComponent,
});

function AppShell() {
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
      className={cn(
        "flex min-h-screen flex-col bg-white",
        serif && "font-serif"
      )}
    >
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster />
      <Footer />
    </div>
  );
}

function RootComponent() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}

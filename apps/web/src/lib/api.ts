import { createApiWithModules } from "@repo/core";

export const api = createApiWithModules({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8000",
  onTokenRefreshFailed: () => {
    console.warn("Token refresh failed in api.ts");
    console.warn("Current pathname:", window.location.pathname);

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      console.warn("Redirecting to /login");
      window.location.href = "/login";
    }
  },
});

export const queryKeys = {
  search: {
    all: ["search"] as const,
    bySlug: (slug: string) => ["search", slug] as const,
    explain: (slug: string, ayahKey: string) =>
      ["search", slug, "explain", ayahKey] as const,
  },
  tafsir: {
    all: ["tafsir"] as const,
    byAyahKey: (ayahKey: string) => ["tafsir", ayahKey] as const,
  },
  bookmarks: {
    all: ["bookmarks"] as const,
  },
  notes: {
    all: ["notes"] as const,
  },
  me: ["me"] as const,
} as const;

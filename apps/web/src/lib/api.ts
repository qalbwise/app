import { createApiWithModules } from "@repo/core";

import { getApiBaseUrl } from "./api-base-url";

export { getApiBaseUrl } from "./api-base-url";

export const api = createApiWithModules({
  baseUrl: getApiBaseUrl(),
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
    versePage: (slug: string, page: number) =>
      ["search", slug, "verse", page] as const,
  },
  bookmarks: {
    all: ["bookmarks"] as const,
  },
  notes: {
    all: ["notes"] as const,
  },
  me: ["me"] as const,
} as const;

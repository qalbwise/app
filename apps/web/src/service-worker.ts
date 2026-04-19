/// <reference lib="webworker" />
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

// Inject the precache manifest from Vite build
precacheAndRoute(self.__WB_MANIFEST);

// Derive the API origin from the env variable baked in at build time
const API_ORIGIN = new URL(
  import.meta.env.VITE_API_URL ?? "http://localhost:8000"
).origin;

// ── Skip-waiting on message from the update prompt ─────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Route 1: Auth endpoints — always go to network ─────────────────────────
registerRoute(
  ({ url }) => url.origin === API_ORIGIN && url.pathname.startsWith("/auth/"),
  new NetworkOnly()
);

// ── Route 2: SSE streams — never cache ─────────────────────────────────────
registerRoute(
  ({ url }) => url.origin === API_ORIGIN && url.pathname.includes("/stream"),
  new NetworkOnly()
);

// ── Route 3: GET /search* & /tafsir* (excluding /stream, /auth/) — SWR ─────
registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    url.origin === API_ORIGIN &&
    (url.pathname.startsWith("/search") ||
      url.pathname.startsWith("/tafsir")) &&
    !url.pathname.includes("/stream") &&
    !url.pathname.startsWith("/auth/"),
  new StaleWhileRevalidate({
    cacheName: "api-content-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        maxEntries: 100,
      }),
    ],
  })
);

// ── Route 4: Images — cache-first, long-lived ──────────────────────────────
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 60,
      }),
    ],
  })
);

// ── Route 5: SPA navigation fallback ───────────────────────────────────────
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

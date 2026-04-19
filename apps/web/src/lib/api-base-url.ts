/**
 * In `vite dev`, use same-origin proxy (`/__dev_api` → VITE_API_URL in vite.config)
 * so mobile/LAN tests avoid CORS (e.g. http://192.168… → https://*.trycloudflare.com).
 * Production builds use `VITE_API_URL` directly.
 */
export function getApiBaseUrl(): string {
  const configured = (
    import.meta.env.VITE_API_URL || "http://localhost:8000"
  ).replace(/\/$/, "");

  if (!import.meta.env.DEV || typeof window === "undefined") {
    return configured;
  }

  return `${window.location.origin}/__dev_api`;
}

import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema.d.ts";

interface CreateApiOptions {
  baseUrl: string;
  onTokenRefreshFailed?: () => void;
}

/**
 * Factory that creates a fully typed API client.
 * Called by the consuming app (apps/web) with its own config,
 * keeping this package environment-agnostic.
 */
export const createApi = ({
  baseUrl,
  onTokenRefreshFailed,
}: CreateApiOptions) => {
  const client = createClient<paths>({ baseUrl });

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const token = localStorage.getItem("access_token");
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      return request;
    },

    async onResponse({ response, request }) {
      if (response.status !== 401) return response;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        onTokenRefreshFailed?.();
        return response;
      }

      const { data } = await client.POST("/auth/refresh", {
        body: { refresh_token: refreshToken },
      });

      if (data?.access_token) {
        localStorage.setItem("access_token", data.access_token);
        request.headers.set("Authorization", `Bearer ${data.access_token}`);
        return fetch(request);
      }

      // Refresh failed — clear tokens and notify the app
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      onTokenRefreshFailed?.();
      return response;
    },
  };

  client.use(authMiddleware);
  return client;
};

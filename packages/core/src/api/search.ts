import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createSearchApi = (client: Client) => ({
  create: (body: { topic: string }) => client.POST("/search", { body }),

  getBySlug: (slug: string) =>
    client.GET("/search/{slug}", { params: { path: { slug } } }),

  stream: (slug: string) =>
    client.GET("/search/{slug}/stream", { params: { path: { slug } } }),

  getVersePage: (slug: string, page: number) =>
    client.GET("/search/{slug}/verse/{page}", {
      params: { path: { slug, page } },
    }),

  explainVerse: (slug: string, page: number) =>
    client.GET("/search/{slug}/verse/{page}/explain", {
      params: { path: { slug, page } },
    }),
});

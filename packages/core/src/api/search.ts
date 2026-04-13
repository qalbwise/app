import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createSearchApi = (client: Client) => ({
  create: (body: { topic: string }) => client.POST("/search", { body }),

  getBySlug: (slug: string) =>
    client.GET("/search/{slug}", { params: { path: { slug } } }),

  stream: (slug: string) =>
    client.GET("/search/{slug}/stream", { params: { path: { slug } } }),

  explain: (slug: string, ayahKey: string) =>
    client.GET("/search/{slug}/explain/{ayah_key}", {
      params: { path: { slug, ayah_key: ayahKey } },
    }),
});

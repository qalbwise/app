import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createBookmarksApi = (client: Client) => ({
  list: () => client.GET("/bookmarks"),

  create: (body: { ayah_key: string }) => client.POST("/bookmarks", { body }),

  delete: (id: string) =>
    client.DELETE("/bookmarks/{bookmark_id}", {
      params: { path: { bookmark_id: id } },
    }),
});

import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createQfBookmarksApi = (client: Client) => ({
  list: () => client.GET("/qf-bookmarks"),

  create: (body: { ayah_key: string }) =>
    client.POST("/qf-bookmarks", { body }),

  delete: (id: string) =>
    client.DELETE("/qf-bookmarks/{bookmark_id}", {
      params: { path: { bookmark_id: id } },
    }),
});

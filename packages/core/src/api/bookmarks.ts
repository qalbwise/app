import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createBookmarksApi = (client: Client) => ({
  list: () => client.GET("/bookmarks"),

  create: (body: { ayah_key: string }) => client.POST("/bookmarks", { body }),

  delete: (id: string) =>
    client.DELETE("/bookmarks/{bookmark_id}", {
      params: { path: { bookmark_id: id } },
    }),

  createNote: (body: {
    topic: string;
    content: string;
    verses?: Record<string, unknown>[];
  }) => client.POST("/notes", { body }),

  listNotes: () => client.GET("/notes"),

  updateNote: (id: string, content: string) =>
    client.PATCH("/notes/{note_id}", {
      params: { path: { note_id: id } },
      body: content,
    }),

  deleteNote: (id: string) =>
    client.DELETE("/notes/{note_id}", {
      params: { path: { note_id: id } },
    }),
});

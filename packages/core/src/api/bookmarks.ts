import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createBookmarksApi = (client: Client) => ({
  create: (body: {
    ayah_key: string;
    surah_name: string;
    arabic_text: string;
    translation: string;
    note?: string;
    extra_data?: Record<string, unknown>;
  }) => client.POST("/bookmarks", { body }),

  list: () => client.GET("/bookmarks"),

  delete: (id: string) =>
    client.DELETE("/bookmarks/{bookmark_id}", {
      params: { path: { bookmark_id: id } },
    }),

  createNote: (body: {
    topic: string;
    content: string;
    verses?: Array<Record<string, unknown>>;
  }) => client.POST("/bookmarks/notes", { body }),

  listNotes: () => client.GET("/bookmarks/notes"),

  updateNote: (id: string, content: string) =>
    client.PATCH("/bookmarks/notes/{note_id}", {
      params: { path: { note_id: id } },
      body: content,
    }),

  deleteNote: (id: string) =>
    client.DELETE("/bookmarks/notes/{note_id}", {
      params: { path: { note_id: id } },
    }),

});

import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createNotesApi = (client: Client) => ({
  create: (body: {
    topic: string;
    content: string;
    verses?: Record<string, unknown>[] | null;
  }) => client.POST("/notes", { body }),

  list: () => client.GET("/notes"),

  update: (id: string, content: string) =>
    client.PATCH("/notes/{note_id}", {
      params: { path: { note_id: id } },
      body: content,
    }),

  delete: (id: string) =>
    client.DELETE("/notes/{note_id}", {
      params: { path: { note_id: id } },
    }),
});

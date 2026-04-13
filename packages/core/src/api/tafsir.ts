import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createTafsirApi = (client: Client) => ({
  get: (ayahKey: string) =>
    client.GET("/tafsir/{ayah_key}", {
      params: { path: { ayah_key: ayahKey } },
    }),
});

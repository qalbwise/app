import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createUsersApi = (client: Client) => ({
  me: () => client.GET("/auth/me"),
});

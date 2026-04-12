import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createUsersApi = (client: Client) => ({
  me: () => client.GET("/users/me"),

  getById: (id: string) =>
    client.GET("/users/{id}", { params: { path: { id } } }),
});

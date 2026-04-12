import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createAuthApi = (client: Client) => ({
  login: (body: { email: string; password: string }) =>
    client.POST("/auth/login", { body }),

  register: (body: { email: string; password: string; full_name: string }) =>
    client.POST("/auth/register", { body }),

  refresh: (body: { refresh_token: string }) =>
    client.POST("/auth/refresh", { body }),
});

import { createApi } from "@/client";

type Client = ReturnType<typeof createApi>;

export const createAuthApi = (client: Client) => ({
  login: (body: { id_token: string }) => client.POST("/auth/login", { body }),

  loginWithAccessToken: (body: { access_token: string }) =>
    client.POST("/auth/login/access-token", { body }),

  refresh: (body: { refresh_token: string }) =>
    client.POST("/auth/refresh", { body }),

  qfAuthorize: () => client.POST("/auth/qf/authorize"),

  qfExchange: (body: { session_code: string }) =>
    client.POST("/auth/qf/exchange", { body }),

  qfGetUser: () => client.GET("/auth/qf/user"),
});

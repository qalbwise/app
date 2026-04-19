import { createApi } from "@/client";
import type { components } from "../schema.d.ts";

type Client = ReturnType<typeof createApi>;

export type UserPreferencesUpdate =
  components["schemas"]["UserPreferencesUpdate"];

export const createUsersApi = (client: Client) => ({
  me: () => client.GET("/auth/me"),

  updatePreferences: (body: UserPreferencesUpdate) =>
    client.PUT("/users/me/preferences", { body }),
});

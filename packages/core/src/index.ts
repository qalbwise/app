import { createAuthApi } from "./api/auth";
import { createUsersApi } from "./api/users";
import { createApi } from "./client";

export { createApi };

/**
 * Main factory — called once in apps/web/src/lib/api.ts.
 * Attaches all feature API modules to a single object.
 */
export const createApiWithModules = (
  options: Parameters<typeof createApi>[0]
) => {
  const client = createApi(options);
  return {
    auth: createAuthApi(client),
    users: createUsersApi(client),
  };
};

export type { components, paths } from "./schema.d.ts";

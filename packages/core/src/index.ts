import { createAuthApi } from "./api/auth";
import { createBookmarksApi } from "./api/bookmarks";
import { createSearchApi } from "./api/search";
import { createTafsirApi } from "./api/tafsir";
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
    search: createSearchApi(client),
    tafsir: createTafsirApi(client),
    bookmarks: createBookmarksApi(client),
    users: createUsersApi(client),
  };
};

import type { components } from "./schema.d.ts";

export type { components, paths } from "./schema.d.ts";
export type TokenResponse = components["schemas"]["TokenResponse"];
export type { UserPreferencesUpdate } from "./api/users";

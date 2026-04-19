import type { UserPreferencesUpdate } from "@repo/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api";
import { useFontPreferencesStore } from "@/modules/preferences/stores/font-preferences-store";

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const hydrateFromServer = useFontPreferencesStore((s) => s.hydrateFromServer);

  return useMutation({
    mutationFn: (body: UserPreferencesUpdate) =>
      api.users.updatePreferences(body),
    onSuccess: (result) => {
      const prefs = result.data;
      if (prefs) {
        hydrateFromServer(prefs);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

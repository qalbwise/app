import type { components, UserPreferencesUpdate } from "@repo/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queryKeys } from "@/lib/api";
import { useFontPreferencesStore } from "@/modules/preferences/stores/font-preferences-store";

type UserPreferences = components["schemas"]["UserPreferences"];

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const hydrateFromServer = useFontPreferencesStore((s) => s.hydrateFromServer);

  return useMutation<UserPreferences, Error, UserPreferencesUpdate>({
    mutationFn: async (body) => {
      const res = await api.users.updatePreferences(body);
      if (res.error) throw new Error("Failed to update preferences");
      return res.data;
    },
    onSuccess: (prefs) => {
      if (prefs) {
        hydrateFromServer(prefs);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

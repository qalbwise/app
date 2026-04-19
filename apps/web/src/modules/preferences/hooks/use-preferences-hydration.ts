import { useEffect } from "react";
import { useMe } from "@/modules/auth/queries/use-me";
import { useFontPreferencesStore } from "@/modules/preferences/stores/font-preferences-store";

/** When `/auth/me` succeeds, apply server preferences (source of truth for logged-in users). */
export function usePreferencesHydration() {
  const me = useMe();
  const hydrateFromServer = useFontPreferencesStore((s) => s.hydrateFromServer);

  useEffect(() => {
    const prefs = me.data?.data?.preferences;
    if (prefs && me.isSuccess) {
      hydrateFromServer(prefs);
    }
  }, [me.data, me.isSuccess, hydrateFromServer]);
}

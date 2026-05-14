import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNetworkState } from "react-use";
import { toast } from "sonner";

interface UseOfflineToastOptions {
  slug: string;
  query: Pick<UseQueryResult, "isSuccess">;
}

export function useOfflineToast({ slug, query }: UseOfflineToastOptions) {
  const offlineToastShownRef = useRef(false);
  const network = useNetworkState();
  const online = network.online ?? true;

  useEffect(() => {
    const sessionKey = `offline-toast-${slug}`;
    if (online) {
      offlineToastShownRef.current = false;
      return;
    }
    if (
      query.isSuccess &&
      !offlineToastShownRef.current &&
      !sessionStorage.getItem(sessionKey)
    ) {
      offlineToastShownRef.current = true;
      sessionStorage.setItem(sessionKey, "1");
      toast.message("You're offline — viewing cached results");
    }
  }, [online, query.isSuccess, slug]);

  return { online };
}

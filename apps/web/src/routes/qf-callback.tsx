import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQfExchange } from "@/modules/auth/data/mutations";

export const Route = createFileRoute("/qf-callback")({
  component: QfCallbackPage,
  validateSearch: (search: Record<string, string>) => ({
    session_code: search.session_code as string | undefined,
  }),
});

function QfCallbackPage() {
  const { session_code } = Route.useSearch();
  const navigate = useNavigate();
  const exchange = useQfExchange();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    if (!session_code) {
      navigate({ to: "/" });
      return;
    }

    called.current = true;

    exchange.mutateAsync({ session_code }).then(() => {
      navigate({ to: "/" });
    });
  }, [session_code, navigate, exchange]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}

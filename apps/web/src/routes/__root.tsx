import { GoogleOAuthProvider } from "@react-oauth/google";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { MotionConfig } from "motion/react";

import "../styles.css";
import { RootLayout } from "@/components/layout/root-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
});

function RootComponent() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const content = (
    <>
      <HeadContent />
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <RootLayout>
            <Outlet />
          </RootLayout>
        </MotionConfig>
      </QueryClientProvider>
      <TanStackDevtools
        config={{ position: "bottom-right" }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );

  if (clientId) {
    return (
      <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider>
    );
  }

  return content;
}

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [{ title: "Qalbwise" }],
  }),
});

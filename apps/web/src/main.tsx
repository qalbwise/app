import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const AppContent = () => {
    if (!clientId) {
      return (
        <div style={{ padding: "20px", color: "red" }}>
          <h2>Configuration Error</h2>
          <p>Google Client ID is not configured</p>
        </div>
      );
    }
    return (
      <GoogleOAuthProvider clientId={clientId}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    );
  };

  root.render(<AppContent />);
}

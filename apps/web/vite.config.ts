import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

const envDir = resolve(__dirname, "../../");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  const apiTarget = (env.VITE_API_URL || "http://localhost:8000").replace(
    /\/$/,
    ""
  );

  /** Same-origin in dev — avoids CORS when testing from http://192.168.x.x:port */
  const apiProxy = {
    "/__dev_api": {
      target: apiTarget,
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(/^\/__dev_api/, ""),
    },
  };

  return {
    server: {
      host: true,
      allowedHosts: true,
      cors: true,
      proxy: apiProxy,
    },
    plugins: [
      devtools(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      viteReact(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "service-worker.ts",
        injectRegister: null,
        manifest: false,
        devOptions: { enabled: true },
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        },
        includeAssets: [
          "favicon.ico",
          "favicon.svg",
          "favicon-96x96.png",
          "apple-touch-icon.png",
          "web-app-manifest-192x192.png",
          "web-app-manifest-512x512.png",
          "manifest.json",
          "browserconfig.xml",
        ],
      }),
    ],
    resolve: {
      alias: {
        "@repo/core": resolve(__dirname, "../../packages/core/src/index.ts"),
        "@/client": resolve(__dirname, "../../packages/core/src/client.ts"),
      },
    },
    envDir,
  };
});

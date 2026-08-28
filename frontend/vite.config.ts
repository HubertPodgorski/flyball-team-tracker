import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Vite's CLI doesn't read a generic PORT env var the way CRA's webpack-dev-server
// did — set it explicitly here so tooling that expects that convention (e.g. the
// Playwright e2e config) keeps working unchanged.
const port = Number(process.env.PORT) || 3000;

export default defineConfig({
  plugins: [
    // Must come before the react plugin — it generates routeTree.gen.ts from
    // src/routes/ on the fly, which the app then imports.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      compiler: true,
    }),
  ],
  server: {
    port,
  },
  preview: {
    port,
  },
  test: {
    environment: "node",
  },
});

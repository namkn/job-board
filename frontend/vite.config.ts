/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/*.test.{ts,tsx}",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/pages/StocksPage.tsx",
      ],
    },
  },
  resolve: {
    // Avoid two copies of React / Router (can happen with Docker volumes); breaks Router context.
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  server: {
    port: 5173,
    host: true,
    // Bind mounts on macOS/Windows often break native file watching; helps HMR in Docker.
    watch: {
      usePolling: true,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router", "react-router-dom"],
  },
});

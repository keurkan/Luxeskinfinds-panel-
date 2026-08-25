import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { anthropicPlugin } from "./server/anthropic-plugin.js";

// Runs on 3001 so it can sit alongside the main site's dev server on 3000.
export default defineConfig(({ mode }) => {
  // Load .env into process.env for the server-side plugin. Nothing here is
  // exposed to the client — Vite only inlines VITE_-prefixed vars.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [react(), anthropicPlugin()],
    server: { port: 3001, strictPort: true },
  };
});

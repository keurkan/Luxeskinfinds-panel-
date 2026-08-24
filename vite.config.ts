import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Runs on 3001 so it can sit alongside the main site's dev server on 3000.
export default defineConfig({
  plugins: [react()],
  server: { port: 3001, strictPort: true },
});

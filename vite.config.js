// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    watch: {
      ignored: ["**/src/db/**", "**/src/db/db.json", "**/*.json"],
    },
  },
});

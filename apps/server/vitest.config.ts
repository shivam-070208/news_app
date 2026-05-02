import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@v1": path.resolve(__dirname, "./src/api/v1"),
    },
    setupFiles: ["./src/__mocks__/db.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
})

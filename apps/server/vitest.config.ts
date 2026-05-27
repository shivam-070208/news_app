import { defineConfig } from "vitest/config"
import path from "path"
import { fileURLToPath } from "node:url"

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@v1": path.resolve(rootDir, "./src/api/v1"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__mocks__/db.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
})

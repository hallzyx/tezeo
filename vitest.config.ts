import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { testTimeout: 30_000, hookTimeout: 30_000, include: ["tests/**/*.test.ts"], env: { DATABASE_URL: "pglite://memory", AURORA_MODE: "simulated" } },
});

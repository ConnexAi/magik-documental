import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/api/**/*.test.ts", "tests/documents/**/*.test.ts", "tests/rules/**/*.test.ts"],
    globalSetup: ["tests/support/vitest-global-setup.ts"],
    // Todas las pruebas comparten el mismo emulador y los mismos contadores
    // de consecutivos: se ejecutan en serie para que sean deterministas.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    reporters: ["default", "json", "junit"],
    outputFile: {
      json: "evidencias/pruebas/api/vitest-results.json",
      junit: "evidencias/pruebas/api/vitest-junit.xml",
    },
  },
});

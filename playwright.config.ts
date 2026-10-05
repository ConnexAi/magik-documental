import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./tests/support/env";

// E2E contra el servidor de pruebas (.next-test) conectado al Firebase Emulator.
// Evidencias: capturas en evidencias/pruebas/e2e/, reporte HTML en
// evidencias/pruebas/reporte-e2e/.
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "evidencias/pruebas/e2e/artefactos",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  reporter: [
    ["list"],
    ["html", { outputFolder: "evidencias/pruebas/reporte-e2e", open: "never" }],
    ["json", { outputFile: "evidencias/pruebas/e2e/playwright-results.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    screenshot: "on",
    trace: "retain-on-failure",
    acceptDownloads: true,
    locale: "es-CO",
    timezoneId: "America/Bogota",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx tsx tests/support/serve.ts",
    url: `${BASE_URL}/api/portfolio`,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});

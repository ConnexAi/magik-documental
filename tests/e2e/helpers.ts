import { mkdirSync } from "node:fs";
import { expect, type Page, type TestInfo } from "@playwright/test";
import { USERS } from "../support/env";

const SHOTS = "evidencias/pruebas/e2e";

// Captura de un paso clave: queda en evidencias/pruebas/e2e/<ID>-<paso>.png
// y adjunta al reporte HTML.
export async function shot(page: Page, info: TestInfo, id: string, step: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  const path = `${SHOTS}/${id}-${step}.png`;
  await page.screenshot({ path, fullPage: true });
  await info.attach(`${id}-${step}`, { path, contentType: "image/png" });
}

export async function login(page: Page, user: keyof typeof USERS): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(USERS[user].email);
  await page.locator("#password").fill(USERS[user].password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/dashboard\/events$/);
}

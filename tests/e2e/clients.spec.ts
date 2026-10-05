import { test, expect } from "@playwright/test";
import { login, shot } from "./helpers";

test.describe("Ficha del cliente (HU-17)", () => {
  test("E2E-CLI-01 · La ficha del cliente lista sus eventos y cotizaciones", async ({ page }, info) => {
    await login(page, "admin");
    await page.getByRole("link", { name: "Clientes" }).click();
    await page.getByRole("row", { name: /Bancolombia/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Historial del cliente")).toBeVisible();
    await expect(dialog.getByText(/EVT-0001/).first()).toBeVisible();
    await expect(dialog.getByText(/Cotizaciones \(\d+\)/)).toBeVisible();
    await expect(dialog.getByText("COT-001-2026")).toBeVisible();
    await expect(dialog.getByText("Borrador")).toBeVisible();
    await shot(page, info, "E2E-CLI-01", "1-ficha-cliente");
  });
});

import { existsSync, readFileSync, statSync } from "node:fs";
import { test, expect, type Download } from "@playwright/test";
import { login, shot } from "./helpers";

test.describe("Cotizaciones desde la UI (HU-03)", () => {
  test("E2E-COT-01 · Crear cotización en un evento y descargar su PDF", async ({ page, context }, info) => {
    await login(page, "collaborator");
    await page.getByRole("row", { name: /EVT-0003/ }).click();
    await expect(page.getByRole("button", { name: "Cotizaciones" })).toBeVisible();
    await shot(page, info, "E2E-COT-01", "1-detalle-evento");

    await page.getByRole("button", { name: "Nueva cotización" }).first().click();
    // El diálogo mueve el foco inicial a Título con un leve retraso; esperar
    // evita que ese cambio de foco desvíe el texto de otro campo
    await expect(page.locator("#q-title")).toBeFocused();
    await page.locator("#q-title").fill("Cotización grados E2E");
    await page.locator("#q-attention").fill("Andrea Ruiz");
    await page.locator("#q-attentionRole").fill("Coordinadora de eventos");
    await page.locator("#q-subject").fill("Producción técnica ceremonia de grados");
    await page.getByRole("button", { name: "Agregar ítem" }).first().click();
    await page.getByRole("button", { name: "Audio" }).click();
    await page.getByRole("button", { name: /Consola digital 32 canales/ }).click();
    await shot(page, info, "E2E-COT-01", "2-formulario-con-item");

    await page.getByRole("button", { name: "Crear cotización" }).click();
    const row = page.getByRole("row", { name: /Cotización grados E2E/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText("1.200.000");
    await shot(page, info, "E2E-COT-01", "3-cotizacion-creada");

    // El enlace abre una pestaña nueva con Content-Disposition: attachment;
    // la descarga puede emitirse en la página original o en la nueva.
    const download = new Promise<Download>((resolve) => {
      page.on("download", resolve);
      context.on("page", (p) => p.on("download", resolve));
    });
    await row.getByTitle("Descargar PDF").click();
    const file = await download;
    const path = "evidencias/pruebas/e2e/E2E-COT-01-cotizacion-descargada.pdf";
    await file.saveAs(path);
    expect(file.suggestedFilename()).toBe("cotizacion-EVT-0003.pdf");
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(5_000);
    expect(readFileSync(path).subarray(0, 5).toString()).toBe("%PDF-");
  });
});

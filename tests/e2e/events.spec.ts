import { test, expect, type Page } from "@playwright/test";
import { login, shot } from "./helpers";

export const E2E_CLIENT = "E2E Cliente Playwright";

// Cuenta solo los clics (escribir en campos no es un clic) para RNF-01
function clickCounter(page: Page) {
  let clicks = 0;
  return {
    click: async (locator: ReturnType<Page["locator"]>) => {
      clicks++;
      await locator.click();
    },
    get count() {
      return clicks;
    },
  };
}

test.describe("Eventos desde el panel (HU-01, HU-02, RNF-01)", () => {
  test("E2E-EVT-01 · Crear evento en máximo 3 clics y verlo en el listado", async ({ page }, info) => {
    await login(page, "collaborator");
    const counter = clickCounter(page);
    await shot(page, info, "E2E-EVT-01", "1-listado-inicial");

    await counter.click(page.getByRole("button", { name: "Nuevo evento" }).first());
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Crear evento").first()).toBeVisible();
    await page.locator("#ev-eventName").fill("E2E Lanzamiento producto");
    await page.locator("#ev-clientName").fill(E2E_CLIENT);
    await page.locator("#ev-place").fill("Teatro Municipal, Cali");
    await page.locator("#ev-date").fill("2026-11-28");
    await shot(page, info, "E2E-EVT-01", "2-formulario");

    await counter.click(dialog.getByRole("button", { name: "Crear evento" }));
    const row = page.getByRole("row", { name: new RegExp(E2E_CLIENT) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(/EVT-\d{4}/);
    await shot(page, info, "E2E-EVT-01", "3-evento-en-listado");

    expect(counter.count).toBeLessThanOrEqual(3);
    info.annotations.push({ type: "clics", description: String(counter.count) });
  });

  test("E2E-EVT-02 · El evento sigue en el listado al recargar (datos vivos, no del build)", async ({ page }, info) => {
    await login(page, "collaborator");
    await page.reload();
    await expect(page.getByRole("row", { name: new RegExp(E2E_CLIENT) })).toBeVisible();
    await shot(page, info, "E2E-EVT-02", "1-listado-recargado");
  });

  test("E2E-EVT-03 · Detalle con pestañas en máximo 3 clics desde el panel", async ({ page }, info) => {
    await login(page, "collaborator");
    await page.getByRole("row", { name: new RegExp(E2E_CLIENT) }).click(); // clic 1
    for (const tab of ["Cotizaciones", "Órdenes de servicio", "Archivos", "Otros documentos"]) {
      await expect(page.getByRole("button", { name: tab })).toBeVisible();
    }
    await shot(page, info, "E2E-EVT-03", "1-detalle-pestanas");
    await page.getByRole("button", { name: "Archivos" }).click(); // clic 2
    await shot(page, info, "E2E-EVT-03", "2-pestana-archivos");
  });

  test("E2E-EVT-04 · Búsqueda por cliente filtra el listado", async ({ page }, info) => {
    await login(page, "collaborator");
    await page.getByPlaceholder("Cliente...").fill("bancolombia");
    await expect(page.getByRole("row", { name: /EVT-0001/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /EVT-0002/ })).toHaveCount(0);
    await shot(page, info, "E2E-EVT-04", "1-busqueda-cliente");
    await page.getByPlaceholder("Cliente...").fill("");
    await expect(page.getByRole("row", { name: /EVT-0002/ })).toBeVisible();
    await shot(page, info, "E2E-EVT-04", "2-filtro-limpio");
  });
});

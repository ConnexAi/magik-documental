import { test, expect, type Page } from "@playwright/test";
import { login, shot } from "./helpers";

// RNF-02: el sistema funciona en navegadores de celular sin instalar nada.
// Se ejecuta en dos proyectos: android-chromium (Pixel 7) e iphone-webkit
// (iPhone 13, motor de Safari). Cada caso corre solo en su proyecto.

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

for (const [id, project, device] of [
  ["E2E-MOV-01", "android-chromium", "Android (Chromium)"],
  ["E2E-MOV-02", "iphone-webkit", "iPhone (Safari/WebKit)"],
] as const) {
  test(`${id} · Panel y portal usables en ${device}`, async ({ page }, info) => {
    test.skip(info.project.name !== project, `Solo en ${project}`);

    await page.goto("/portal");
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    await shot(page, info, id, "1-portal");

    await login(page, "collaborator");
    await expect(page.getByRole("row", { name: /EVT-0001/ })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    await shot(page, info, id, "2-eventos");

    // Las columnas de la derecha se alcanzan desplazando la tabla, no quedan cortadas
    const fecha = page.getByRole("columnheader", { name: "Fecha" });
    await fecha.scrollIntoViewIfNeeded();
    await expect(fecha).toBeInViewport();
    await shot(page, info, id, "2b-tabla-desplazada");

    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("link", { name: "Plantillas" }).last()).toBeVisible();
    await shot(page, info, id, "3-menu");

    await page.getByRole("link", { name: "Plantillas" }).last().click();
    await expect(page).toHaveURL(/\/dashboard\/templates$/);
    await expect(page.getByText("Cotización estándar")).toBeVisible();
    await shot(page, info, id, "4-plantillas");
  });
}

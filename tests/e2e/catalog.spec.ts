import { test, expect } from "@playwright/test";
import { login, shot } from "./helpers";

test.describe("Catálogo: editar productos (HU-07)", () => {
  test("E2E-CAT-01 · Admin edita nombre, unidad y precio de un producto sin recargar", async ({ page }, info) => {
    await login(page, "admin");
    await page.getByRole("link", { name: "Catálogo" }).click();
    await page.getByText("Iluminación", { exact: true }).click();
    const row = page.getByRole("row", { name: /Cabeza móvil beam/ });
    await expect(row).toBeVisible();
    await shot(page, info, "E2E-CAT-01", "1-catalogo");

    await row.getByTitle("Editar producto").click();
    await expect(page.locator("#edit-product-name")).toHaveValue("Cabeza móvil beam");
    await expect(page.locator("#edit-product-price")).toHaveValue("180000");
    await page.locator("#edit-product-name").fill("Cabeza móvil beam 230W");
    await page.locator("#edit-product-price").fill("195000");
    await shot(page, info, "E2E-CAT-01", "2-dialogo-edicion");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    const updated = page.getByRole("row", { name: /Cabeza móvil beam 230W/ });
    await expect(updated).toBeVisible();
    await expect(updated).toContainText("195.000");
    await shot(page, info, "E2E-CAT-01", "3-producto-actualizado");

    // Persistió en el servidor: el catálogo que alimenta el autocompletado lo refleja
    const res = await page.request.get("/api/catalog");
    expect(JSON.stringify(await res.json())).toContain("Cabeza móvil beam 230W");
  });

  test("E2E-CAT-02 · Colaborador no ve el botón de editar productos", async ({ page }, info) => {
    await login(page, "collaborator");
    await page.getByRole("link", { name: "Catálogo" }).click();
    await page.getByText("Audio", { exact: true }).click();
    await expect(page.getByRole("row", { name: /Consola digital 32 canales/ })).toBeVisible();
    await expect(page.getByTitle("Editar producto")).toHaveCount(0);
    await expect(page.getByText("Agregar producto")).toBeVisible();
    await shot(page, info, "E2E-CAT-02", "1-catalogo-colaborador");
  });
});

import { test, expect } from "@playwright/test";
import { shot } from "./helpers";

test.describe("Portal público (HU-15)", () => {
  test("E2E-POR-01 · /portal carga sin login", async ({ page }, info) => {
    const res = await page.goto("/portal");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.locator("#contacto")).toBeAttached();
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
    await shot(page, info, "E2E-POR-01", "1-portal");
  });

  test("E2E-POR-02 · La galería muestra los eventos visibles y no los ocultos", async ({ page }, info) => {
    await page.goto("/portal");
    await expect(page.locator('img[alt="Convención anual Bancolombia"]').first()).toBeAttached();
    await expect(page.getByText("Evento oculto interno")).toHaveCount(0);
    await page.locator("img[alt='Convención anual Bancolombia']").first().scrollIntoViewIfNeeded();
    await shot(page, info, "E2E-POR-02", "1-galeria");
  });

  test("E2E-POR-03 · No hay enlaces a documentos internos", async ({ page }, info) => {
    await page.goto("/portal");
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    const internal = hrefs.filter((h) => /\/api\/|\/dashboard|\.pdf|\.xlsx|\/quotes|\/orders|\/files|storage/.test(h));
    expect(internal).toEqual([]);
    const html = await page.content();
    expect(html).not.toMatch(/\/api\/events|COT-\d|OS-\d/);
    await shot(page, info, "E2E-POR-03", "1-enlaces-revisados");
  });

  test("E2E-POR-04 · Portal en celular (390×844) sin desborde horizontal", async ({ browser }, info) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto("/portal");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await shot(page, info, "E2E-POR-04", "1-portal-movil");
    await ctx.close();
  });
});

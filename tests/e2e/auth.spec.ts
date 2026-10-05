import { test, expect } from "@playwright/test";
import { login, shot } from "./helpers";
import { BASE_URL } from "../support/env";

test.describe("Autenticación y acceso por rol (HU-09, RNF-02)", () => {
  test("E2E-AUTH-01 · Login como admin redirige a /dashboard/events", async ({ page }, info) => {
    await page.goto("/login");
    await shot(page, info, "E2E-AUTH-01", "1-login");
    await login(page, "admin");
    await expect(page.getByRole("link", { name: "Usuarios" })).toBeVisible();
    await shot(page, info, "E2E-AUTH-01", "2-panel-admin");
  });

  test("E2E-AUTH-02 · Login como colaborador redirige a /dashboard/events sin módulo de usuarios", async ({ page }, info) => {
    await login(page, "collaborator");
    await expect(page.getByRole("link", { name: "Eventos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Usuarios" })).toHaveCount(0);
    await shot(page, info, "E2E-AUTH-02", "1-panel-colaborador");
  });

  test("E2E-AUTH-03 · Sin sesión, /dashboard redirige a /login", async ({ page }, info) => {
    await page.goto("/dashboard/events");
    await expect(page).toHaveURL(/\/login/);
    await shot(page, info, "E2E-AUTH-03", "1-redirigido-login");
  });

  test("E2E-AUTH-04 · Colaborador intentando /dashboard/admin es redirigido", async ({ page }, info) => {
    await login(page, "collaborator");
    await page.goto("/dashboard/admin/users");
    await expect(page).toHaveURL(/\/dashboard\/events$/);
    await shot(page, info, "E2E-AUTH-04", "1-redirigido-eventos");
  });

  test("E2E-AUTH-05 · Cookies falsificadas no dan acceso a datos de admin", async ({ page, context }, info) => {
    await context.addCookies([
      { name: "magik_token", value: "token-inventado", url: BASE_URL },
      { name: "magik_role", value: "admin", url: BASE_URL },
    ]);
    await page.goto("/dashboard/admin/users");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("test-admin@magikenter.com")).toHaveCount(0);
    await shot(page, info, "E2E-AUTH-05", "1-cookies-falsas-login");
  });
});

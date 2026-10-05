import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import type { CatalogProduct, CatalogRubro } from "@/lib/types";

// /api/catalog es la fuente del autocompletado de ítems en cotizaciones y
// órdenes (los diálogos la consultan cada vez que se abren).
async function catalogAs(who: "admin" | "collaborator"): Promise<CatalogRubro[]> {
  const res = await call(who, "get", "/api/catalog");
  expect(res.status).toBe(200);
  return (res.body as { rubros: CatalogRubro[] }).rubros;
}

describe("Catálogo (HU-07, HU-08)", () => {
  let adminRubro: CatalogRubro;
  let colabRubro: CatalogRubro;
  let colabProduct: CatalogProduct;

  it("API-CAT-01 · Admin crea rubro → disponible en el autocompletado", async () => {
    const res = await call("admin", "post", "/api/catalog/rubros", { name: "Pantallas LED", products: [] });
    expect(res.status).toBe(201);
    adminRubro = (res.body as { rubro: CatalogRubro }).rubro;
    expect((await catalogAs("collaborator")).map((r) => r.name)).toContain("Pantallas LED");
  });

  it("API-CAT-02 · Colaborador crea rubro → 201", async () => {
    const res = await call("collaborator", "post", "/api/catalog/rubros", { name: "Carpas", products: [] });
    expect(res.status).toBe(201);
    colabRubro = (res.body as { rubro: CatalogRubro }).rubro;
  });

  it("API-CAT-03 · Colaborador crea producto → disponible para todos", async () => {
    const res = await call("collaborator", "post", `/api/catalog/rubros/${adminRubro.id}/products`, {
      name: "Pantalla LED P3 3x2m", unit: "m²", defaultPrice: 450_000,
    });
    expect(res.status).toBe(201);
    colabProduct = (res.body as { product: CatalogProduct }).product;
    const rubro = (await catalogAs("admin")).find((r) => r.id === adminRubro.id);
    expect(rubro?.products.map((p) => p.name)).toContain("Pantalla LED P3 3x2m");
  });

  it("API-CAT-04 · Admin edita producto → cambio visible de inmediato", async () => {
    const res = await call("admin", "patch", `/api/catalog/rubros/${adminRubro.id}/products/${colabProduct.id}`, { defaultPrice: 480_000 });
    expect(res.status).toBe(200);
    const rubro = (await catalogAs("collaborator")).find((r) => r.id === adminRubro.id);
    expect(rubro?.products.find((p) => p.id === colabProduct.id)?.defaultPrice).toBe(480_000);
  });

  it("API-CAT-05 · Admin edita nombre de rubro → cambio visible de inmediato", async () => {
    const res = await call("admin", "patch", `/api/catalog/rubros/${adminRubro.id}`, { name: "Pantallas LED y video" });
    expect(res.status).toBe(200);
    expect((await catalogAs("collaborator")).map((r) => r.name)).toContain("Pantallas LED y video");
  });

  it("API-CAT-06 · Colaborador elimina rubro → 403 y el rubro sigue existiendo", async () => {
    const res = await call("collaborator", "delete", `/api/catalog/rubros/${colabRubro.id}`);
    expect(res.status).toBe(403);
    expect((await catalogAs("collaborator")).map((r) => r.id)).toContain(colabRubro.id);
  });

  it("API-CAT-07 · Colaborador elimina producto → 403", async () => {
    const res = await call("collaborator", "delete", `/api/catalog/rubros/${adminRubro.id}/products/${colabProduct.id}`);
    expect(res.status).toBe(403);
  });

  it("API-CAT-08 · Admin elimina producto y rubro → 200 y desaparecen", async () => {
    expect((await call("admin", "delete", `/api/catalog/rubros/${adminRubro.id}/products/${colabProduct.id}`)).status).toBe(200);
    expect((await call("admin", "delete", `/api/catalog/rubros/${colabRubro.id}`)).status).toBe(200);
    const ids = (await catalogAs("collaborator")).map((r) => r.id);
    expect(ids).not.toContain(colabRubro.id);
  });
});

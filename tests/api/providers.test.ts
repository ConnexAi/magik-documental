import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { SEED_PROVIDER } from "../emulator/seed";
import type { Provider } from "@/lib/types";

async function providerIds(): Promise<string[]> {
  const res = await call("collaborator", "get", "/api/providers");
  expect(res.status).toBe(200);
  return (res.body as { providers: Provider[] }).providers.map((p) => p.id);
}

describe("Directorio de proveedores (RF-10, HU-16)", () => {
  let created: Provider;

  it("API-PRV-01 · Colaborador intenta crear proveedor → 403", async () => {
    const res = await call("collaborator", "post", "/api/providers", { name: "Proveedor colaborador", categories: [] });
    expect(res.status).toBe(403);
  });

  it("API-PRV-02 · Admin crea proveedor → disponible para el autocompletado del colaborador", async () => {
    const res = await call("admin", "post", "/api/providers", {
      name: "Luces del Pacífico SAS", contact: "Ana Mora", phone: "3157654321",
      email: "ana@lucespacifico.test", categories: ["Iluminación"],
    });
    expect(res.status).toBe(201);
    created = (res.body as { provider: Provider }).provider;
    expect(await providerIds()).toContain(created.id);
  });

  it("API-PRV-03 · Colaborador intenta eliminar proveedor → 403 y el proveedor sigue", async () => {
    const res = await call("collaborator", "delete", `/api/providers/${SEED_PROVIDER.id}`);
    expect(res.status).toBe(403);
    expect(await providerIds()).toContain(SEED_PROVIDER.id);
  });

  it("API-PRV-04 · Admin elimina proveedor → 200", async () => {
    const res = await call("admin", "delete", `/api/providers/${created.id}`);
    expect(res.status).toBe(200);
    expect(await providerIds()).not.toContain(created.id);
  });
});

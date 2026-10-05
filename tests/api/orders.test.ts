import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { SEED, SEED_PROVIDER, SEED_QUOTE_ITEMS } from "../emulator/seed";
import { providerToOrderFields } from "@/lib/order-provider";
import type { Provider, ServiceOrder } from "@/lib/types";

const E = `/api/events/${SEED.events[0]}`;

describe("Órdenes de servicio (HU-04, HU-16)", () => {
  let order: ServiceOrder;

  it("API-OS-01 · El autocompletado obtiene el proveedor con todos sus datos", async () => {
    const res = await call("collaborator", "get", "/api/providers");
    expect(res.status).toBe(200);
    const provider = (res.body as { providers: Provider[] }).providers.find((p) => p.id === SEED_PROVIDER.id);
    expect(provider).toBeDefined();
    const fields = providerToOrderFields(provider!);
    expect(fields).toEqual({
      providerId: SEED_PROVIDER.id,
      providerName: "Sonido Total SAS",
      nitProveedor: "",
      razonSocial: "Sonido Total SAS",
      contactoProveedor: "Carlos Ruiz",
      emailProveedor: "ventas@sonidototal.test",
      celularProveedor: "3001234567",
    });
  });

  it("API-OS-02 · Crear orden asigna el consecutivo OS-000-AAAA y guarda proveedor, fechas y pago", async () => {
    const fields = providerToOrderFields(SEED_PROVIDER);
    const res = await call("collaborator", "post", `${E}/orders`, {
      ...fields, title: "Audio convención", items: [SEED_QUOTE_ITEMS[1]],
      fechaMontaje: "2026-03-14", horaMontaje: "08:00", fechaEvento: "2026-03-15",
      anticipo: true, anticipoValor: 700_000, anticipoFecha: "2026-03-01",
    });
    expect(res.status).toBe(201);
    order = (res.body as { order: ServiceOrder }).order;
    expect(order.orderConsecutive).toMatch(new RegExp(`^OS-\\d{3}-${new Date().getFullYear()}$`));

    const saved = (await call("collaborator", "get", `${E}/orders/${order.id}`)).body as { order: ServiceOrder };
    expect(saved.order).toMatchObject({
      razonSocial: "Sonido Total SAS", contactoProveedor: "Carlos Ruiz",
      emailProveedor: "ventas@sonidototal.test", celularProveedor: "3001234567",
      fechaMontaje: "2026-03-14", fechaEvento: "2026-03-15", anticipo: true, anticipoValor: 700_000,
    });
  });

  it("API-OS-03 · Colaborador intentando eliminar orden → 403", async () => {
    const res = await call("collaborator", "delete", `${E}/orders/${order.id}`);
    expect(res.status).toBe(403);
  });

  it("API-OS-04 · Admin elimina orden → 200", async () => {
    const res = await call("admin", "delete", `${E}/orders/${order.id}`);
    expect(res.status).toBe(200);
  });
});

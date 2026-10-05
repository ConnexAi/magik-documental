import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { SEED } from "../emulator/seed";
import type { ClientHistory, Client, MagikEvent } from "@/lib/types";

const C = `/api/clients/${SEED.clientId}`;

describe("Directorio de clientes (HU-17)", () => {
  let eventId = "";

  it("API-CLI-01 · Crear evento vinculado a un cliente actualiza eventIds del cliente", async () => {
    const res = await call("collaborator", "post", "/api/events", {
      eventName: "Lanzamiento app Bancolombia", clientName: "Bancolombia", clientId: SEED.clientId,
      eventType: "corporativo", place: "Hotel Dann Carlton, Cali", date: "2026-12-02",
    });
    expect(res.status).toBe(201);
    eventId = (res.body as { event: MagikEvent }).event.id;

    const detail = (await call("admin", "get", C)).body as { client: Client };
    expect(detail.client.eventIds).toContain(eventId);
    expect(detail.client.eventIds).toContain(SEED.events[0]);
  });

  it("API-CLI-02 · La ficha del cliente lista sus eventos", async () => {
    const res = await call("admin", "get", C);
    expect(res.status).toBe(200);
    const events = (res.body as { events: MagikEvent[] }).events;
    expect(events.map((e) => e.id).sort()).toEqual([SEED.events[0], eventId].sort());
  });

  it("API-CLI-04 · La ficha incluye eventIds, eventos y las cotizaciones de esos eventos", async () => {
    const res = await call("admin", "get", C);
    const body = res.body as ClientHistory;
    expect(body.client.eventIds.length).toBeGreaterThan(0);
    expect(body.events.length).toBeGreaterThanOrEqual(1);
    const cot = body.quotes.find((q) => q.consecutive === "COT-001-2026");
    expect(cot).toBeDefined();
    expect(cot?.eventId).toBe(SEED.events[0]);
    expect(cot?.status).toBe("draft");
    expect(Number.isNaN(Date.parse(cot?.createdAt ?? ""))).toBe(false);
    expect(body.quotes.every((q) => body.client.eventIds.includes(q.eventId))).toBe(true);
  });

  it("API-CLI-05 · La ficha lista todos los eventos, sin el límite de 10", async () => {
    for (let i = 0; i < 11; i++) {
      const created = await call("collaborator", "post", "/api/events", {
        eventName: `Evento cliente ${i}`, clientName: "Bancolombia", clientId: SEED.clientId,
        eventType: "corporativo", place: "Cali", date: `2027-01-${String(i + 1).padStart(2, "0")}`,
      });
      expect(created.status).toBe(201);
    }
    const body = (await call("admin", "get", C)).body as ClientHistory;
    expect(body.client.eventIds.length).toBeGreaterThan(10);
    expect(body.events.length).toBe(body.client.eventIds.length);
  });

  it("API-CLI-03 · El cliente aparece en el directorio para el autocompletado", async () => {
    const res = await call("collaborator", "get", "/api/clients");
    expect((res.body as { clients: Client[] }).clients.map((c) => c.id)).toContain(SEED.clientId);
  });
});

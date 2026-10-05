import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { SEED } from "../emulator/seed";
import type { Client, MagikEvent } from "@/lib/types";

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

  it("API-CLI-03 · El cliente aparece en el directorio para el autocompletado", async () => {
    const res = await call("collaborator", "get", "/api/clients");
    expect((res.body as { clients: Client[] }).clients.map((c) => c.id)).toContain(SEED.clientId);
  });
});

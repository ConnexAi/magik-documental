import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { testDb } from "../support/admin";
import type { MagikEvent } from "@/lib/types";

const newEvent = (over: Partial<MagikEvent> = {}) => ({
  eventName: "Lanzamiento prueba", clientName: "Cliente Prueba Eventos", eventType: "corporativo",
  place: "Hotel Intercontinental, Cali", date: "2026-11-20", ...over,
});

async function counter(): Promise<number> {
  const doc = await testDb().collection("counters").doc("events").get();
  return (doc.data() as { count: number }).count;
}

async function search(query: string): Promise<MagikEvent[]> {
  const res = await call("collaborator", "get", `/api/events?${query}`);
  expect(res.status).toBe(200);
  return (res.body as { events: MagikEvent[] }).events;
}

describe("Eventos (HU-01, HU-02, HU-10)", () => {
  let createdId = "";

  it("API-EVT-01 · Crear evento asigna el consecutivo siguiente EVT-000X", async () => {
    const before = await counter();
    const res = await call("collaborator", "post", "/api/events", newEvent());
    expect(res.status).toBe(201);
    const event = (res.body as { event: MagikEvent }).event;
    expect(event.consecutive).toMatch(/^EVT-\d{4}$/);
    expect(event.consecutive).toBe(`EVT-${String(before + 1).padStart(4, "0")}`);
    createdId = event.id;
  });

  it("API-EVT-02 · El evento creado aparece en el listado", async () => {
    const events = await search("");
    expect(events.map((e) => e.id)).toContain(createdId);
  });

  it("API-EVT-03 · Creaciones simultáneas reciben consecutivos únicos", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => call("collaborator", "post", "/api/events", newEvent({ eventName: `Simultáneo ${i}` })))
    );
    const consecutives = results.map((r) => (r.body as { event: MagikEvent }).event.consecutive);
    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(new Set(consecutives).size).toBe(5);
  });

  it("API-EVT-04 · Buscar por cliente devuelve solo coincidencias", async () => {
    const events = await search("clientName=bancolombia");
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.clientName.toLowerCase().includes("bancolombia"))).toBe(true);
    expect(events.map((e) => e.consecutive)).toContain("EVT-0001");
  });

  it("API-EVT-05 · Buscar por año devuelve solo eventos de ese año", async () => {
    const events = await search("year=2025");
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.date.startsWith("2025"))).toBe(true);
    expect(events.map((e) => e.consecutive)).toContain("EVT-0002");
  });

  it("API-EVT-06 · Buscar por tipo devuelve solo ese tipo", async () => {
    const events = await search("eventType=especial");
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.eventType === "especial")).toBe(true);
  });

  it("API-EVT-07 · Buscar por lugar devuelve solo coincidencias", async () => {
    const events = await search("place=pascual");
    expect(events.map((e) => e.consecutive)).toEqual(["EVT-0002"]);
  });

  it("API-EVT-08 · Filtros combinados (cliente + año + tipo + lugar)", async () => {
    const events = await search("clientName=bancolombia&year=2026&eventType=corporativo&place=valle");
    expect(events.map((e) => e.consecutive)).toEqual(["EVT-0001"]);
  });

  it("API-EVT-14 · Buscar por consecutivo exacto devuelve solo ese evento", async () => {
    const events = await search("consecutive=EVT-0002");
    expect(events.map((e) => e.consecutive)).toEqual(["EVT-0002"]);
  });

  it("API-EVT-15 · Buscar por consecutivo parcial, sin distinguir mayúsculas", async () => {
    const events = await search("consecutive=evt-0003");
    expect(events.map((e) => e.consecutive)).toEqual(["EVT-0003"]);
    const none = await search("consecutive=EVT-9999");
    expect(none).toEqual([]);
  });

  it("API-EVT-09 · La búsqueda responde en menos de 1 segundo", async () => {
    await search("clientName=a"); // calentamiento
    const start = performance.now();
    await search("clientName=bancolombia&year=2026");
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it("API-EVT-10 · Crear evento sin campos obligatorios → 400", async () => {
    const res = await call("collaborator", "post", "/api/events", { eventName: "Incompleto", clientName: "", place: "" });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toMatch(/clientName/);
  });

  it("API-EVT-11 · Consultar un ID inexistente → 404", async () => {
    const res = await call("collaborator", "get", "/api/events/no-existe-123");
    expect(res.status).toBe(404);
  });

  it("API-EVT-12 · Colaborador no puede eliminar eventos → 403", async () => {
    const res = await call("collaborator", "delete", `/api/events/${createdId}`);
    expect(res.status).toBe(403);
    const still = await call("collaborator", "get", `/api/events/${createdId}`);
    expect(still.status).toBe(200);
  });

  it("API-EVT-13 · Admin elimina evento → 200 y deja de existir", async () => {
    const res = await call("admin", "delete", `/api/events/${createdId}`);
    expect(res.status).toBe(200);
    const gone = await call("admin", "get", `/api/events/${createdId}`);
    expect(gone.status).toBe(404);
  });
});

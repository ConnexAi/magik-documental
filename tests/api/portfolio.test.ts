import { describe, expect, it } from "vitest";
import { api, call } from "../support/http";
import { SEED } from "../emulator/seed";
import type { PortfolioItem } from "@/lib/types";

const PUBLIC_FIELDS = ["id", "eventId", "eventName", "imageUrls", "visible", "order", "publishedAt"];

async function publicItems(): Promise<PortfolioItem[]> {
  const res = await api().get("/api/portfolio");
  expect(res.status).toBe(200);
  return (res.body as { items: PortfolioItem[] }).items;
}

const photos = (n: number) => Array.from({ length: n }, (_, i) => `https://storage.test/foto-${i}.jpg`);

describe("Portafolio y portal (HU-14, HU-15)", () => {
  let created: PortfolioItem;

  it("API-POR-01 · GET público devuelve solo items visibles", async () => {
    const items = await publicItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.visible === true)).toBe(true);
    expect(items.map((i) => i.id)).toContain(SEED.portfolioVisible);
    expect(items.map((i) => i.id)).not.toContain(SEED.portfolioHidden);
  });

  it("API-POR-02 · GET público no expone datos internos", async () => {
    const res = await api().get("/api/portfolio");
    for (const item of (res.body as { items: Record<string, unknown>[] }).items) {
      expect(Object.keys(item).every((k) => PUBLIC_FIELDS.includes(k))).toBe(true);
    }
    for (const forbidden of ["pdfUrl", "createdBy", "storageUrl", "subtotal", "consecutive", "COT-", "OS-"]) {
      expect(res.text).not.toContain(forbidden);
    }
  });

  it("API-POR-03 · POST sin sesión → 401", async () => {
    const res = await api().post("/api/portfolio").send({ eventId: SEED.events[0], eventName: "x", imageUrls: [], visible: true, order: 0 });
    expect(res.status).toBe(401);
  });

  it("API-POR-04 · Admin agrega fotos: 6 fotos → 400 (máximo 5)", async () => {
    const res = await call("admin", "post", "/api/portfolio", {
      eventId: SEED.events[2], eventName: "Grados UAO", imageUrls: photos(6), visible: true, order: 5,
    });
    expect(res.status).toBe(400);
  });

  it("API-POR-05 · Admin agrega fotos: 5 fotos → 201", async () => {
    const res = await call("admin", "post", "/api/portfolio", {
      eventId: SEED.events[2], eventName: "Grados UAO", imageUrls: photos(5), visible: true, order: 5,
    });
    expect(res.status).toBe(201);
    created = (res.body as { item: PortfolioItem }).item;
  });

  it("API-POR-06 · Editar con más de 5 fotos → 400", async () => {
    const res = await call("admin", "patch", `/api/portfolio/${created.id}`, { imageUrls: photos(6) });
    expect(res.status).toBe(400);
  });

  it("API-POR-07 · Admin oculta y reordena: el item sale del portal público", async () => {
    const res = await call("admin", "patch", `/api/portfolio/${created.id}`, { visible: false, order: 2 });
    expect(res.status).toBe(200);
    expect((res.body as { item: PortfolioItem }).item.order).toBe(2);
    expect((await publicItems()).map((i) => i.id)).not.toContain(created.id);
  });

  it("API-POR-08 · /portal carga sin sesión y no incluye eventos ocultos ni documentos", async () => {
    const res = await api().get("/portal");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Convención anual Bancolombia");
    expect(res.text).not.toContain("Evento oculto interno");
    expect(res.text).not.toMatch(/\/api\/events|\/quotes\/|\/orders\/|\.pdf|\.xlsx/);
  });
});

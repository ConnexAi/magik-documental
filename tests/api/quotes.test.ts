import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { testDb } from "../support/admin";
import { SEED, SEED_QUOTE_ITEMS, SEED_QUOTE_DISCOUNT } from "../emulator/seed";
import type { Quote } from "@/lib/types";

const E = `/api/events/${SEED.events[0]}`;
const YEAR = new Date().getFullYear();

async function counter(): Promise<number> {
  const doc = await testDb().collection("counters").doc("quotes").get();
  return (doc.data() as { count: number }).count;
}

const baseQuote = {
  title: "Cotización prueba", attention: "Laura Gómez", attentionRole: "Jefe de eventos",
  subject: "Montaje técnico", paymentTerms: "50% anticipo - 50% contraentrega",
};

describe("Cotizaciones (HU-03, HU-11)", () => {
  let quote: Quote;

  it("API-COT-01 · Crear cotización asigna el consecutivo siguiente COT-000-AAAA", async () => {
    const before = await counter();
    const res = await call("collaborator", "post", `${E}/quotes`, {
      ...baseQuote, items: SEED_QUOTE_ITEMS, discount: SEED_QUOTE_DISCOUNT, hasIva: true,
    });
    expect(res.status).toBe(201);
    quote = (res.body as { quote: Quote }).quote;
    expect(quote.consecutive).toMatch(/^COT-\d{3}-\d{4}$/);
    expect(quote.consecutive).toBe(`COT-${String(before + 1).padStart(3, "0")}-${YEAR}`);
  });

  it("API-COT-02 · Calcula subtotal, descuento, IVA 19% y total", async () => {
    // 1.200.000 + 4×350.000 + 6×180.000 = 3.680.000; −180.000 = 3.500.000;
    // IVA 665.000; total 4.165.000
    expect(quote.subtotal).toBe(3_680_000);
    expect(quote.discount).toBe(180_000);
    expect(quote.total).toBe(4_165_000);
  });

  it("API-COT-03 · El servidor recalcula y no acepta totales manipulados por el cliente", async () => {
    const res = await call("collaborator", "post", `${E}/quotes`, {
      ...baseQuote, items: SEED_QUOTE_ITEMS, hasIva: false, subtotal: 1, total: 1,
    });
    const q = (res.body as { quote: Quote }).quote;
    expect(q.subtotal).toBe(3_680_000);
    expect(q.total).toBe(3_680_000);
  });

  it("API-COT-04 · Editar el descuento recalcula el total", async () => {
    const res = await call("collaborator", "patch", `${E}/quotes/${quote.id}`, { discount: 680_000 });
    expect(res.status).toBe(200);
    const q = (res.body as { quote: Quote }).quote;
    // (3.680.000 − 680.000) × 1,19 = 3.570.000
    expect(q.total).toBe(3_570_000);
  });

  it("API-COT-05 · Duplicar conserva ítems y condiciones y recibe el siguiente consecutivo", async () => {
    const before = await counter();
    const res = await call("collaborator", "post", `${E}/quotes/${SEED.quoteId}/duplicate`);
    expect(res.status).toBe(201);
    const copy = (res.body as { quote: Quote }).quote;
    const original = (await call("collaborator", "get", `${E}/quotes/${SEED.quoteId}`)).body as { quote: Quote };
    expect(copy.id).not.toBe(SEED.quoteId);
    expect(copy.items).toEqual(original.quote.items);
    expect(copy.discount).toBe(original.quote.discount);
    expect(copy.hasIva).toBe(original.quote.hasIva);
    expect(copy.paymentTerms).toBe(original.quote.paymentTerms);
    expect(copy.total).toBe(original.quote.total);
    expect(copy.consecutive).not.toBe(original.quote.consecutive);
    expect(copy.consecutive).toBe(`COT-${String(before + 1).padStart(3, "0")}-${YEAR}`);
  });

  it("API-COT-06 · Colaborador intentando eliminar cotización → 403", async () => {
    const res = await call("collaborator", "delete", `${E}/quotes/${quote.id}`);
    expect(res.status).toBe(403);
  });

  it("API-COT-07 · Admin elimina cotización → 200", async () => {
    const res = await call("admin", "delete", `${E}/quotes/${quote.id}`);
    expect(res.status).toBe(200);
  });
});

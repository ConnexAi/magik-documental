import { writeFileSync, mkdirSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { PDFParse } from "pdf-parse";
import { download } from "../support/download";
import { SEED } from "../emulator/seed";

const E = `/api/events/${SEED.events[0]}`;
const EVIDENCE = "evidencias/pruebas/api";

async function pdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

describe("PDF de cotización (HU-03)", () => {
  let file: Awaited<ReturnType<typeof download>>;
  let text = "";

  beforeAll(async () => {
    file = await download(`${E}/quotes/${SEED.quoteId}/pdf`);
    mkdirSync(EVIDENCE, { recursive: true });
    writeFileSync(`${EVIDENCE}/cotizacion-COT-001-2026.pdf`, file.buffer);
    text = await pdfText(file.buffer);
  });

  it("DOC-PDF-01 · El endpoint devuelve un PDF no vacío", () => {
    expect(file.status).toBe(200);
    expect(file.type).toBe("application/pdf");
    expect(file.disposition).toContain("cotizacion-EVT-0001.pdf");
    expect(file.buffer.length).toBeGreaterThan(5_000);
    expect(file.buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("DOC-PDF-02 · Contiene el consecutivo COT-001-2026", () => {
    expect(text).toContain("COT-001-2026");
  });

  it("DOC-PDF-03 · Contiene los totales calculados", () => {
    expect(text).toContain("3.680.000"); // subtotal
    expect(text).toContain("180.000"); // descuento
    expect(text).toContain("3.500.000"); // subtotal con descuento
    expect(text).toContain("665.000"); // IVA 19 %
    expect(text).toContain("4.165.000"); // total
    expect(text).toMatch(/TOTAL/);
  });

  it("DOC-PDF-04 · Contiene una sección por rubro con sus productos", () => {
    expect(text).toContain("Audio");
    expect(text).toContain("Iluminación");
    expect(text).toContain("Consola digital 32 canales");
    expect(text).toContain("Parlante line array");
    expect(text).toContain("Cabeza móvil beam");
    // Los productos de Audio aparecen antes que la sección de Iluminación
    expect(text.indexOf("Parlante line array")).toBeLessThan(text.indexOf("Cabeza móvil beam"));
  });

  it("DOC-PDF-05 · Contiene datos del cliente y del evento", () => {
    expect(text).toContain("Bancolombia");
    expect(text).toContain("Laura Gómez");
    expect(text).toContain("15/03/2026");
  });
});

describe("PDF de orden de servicio (HU-04)", () => {
  it("DOC-PDF-06 · Incluye consecutivo, proveedor, fechas y condiciones de pago", async () => {
    const file = await download(`${E}/orders/${SEED.orderId}/pdf`);
    expect(file.status).toBe(200);
    writeFileSync(`${EVIDENCE}/orden-OS-001-2026.pdf`, file.buffer);
    const text = await pdfText(file.buffer);
    for (const expected of [
      "OS-001-2026", "Sonido Total SAS", "Carlos Ruiz", "ventas@sonidototal.test", "3001234567",
      "14/03/2026", "15/03/2026", "ANTICIPO", "700.000", "SALDO",
    ]) {
      expect(text).toContain(expected);
    }
  });
});

import { writeFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { download } from "../support/download";
import { SEED } from "../emulator/seed";

const E = `/api/events/${SEED.events[0]}`;
const EVIDENCE = "evidencias/pruebas/api";
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function rows(buffer: Buffer, sheet: string): string[][] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  expect(wb.SheetNames).toContain(sheet);
  return XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sheet], { header: 1, defval: "" })
    .map((r) => r.map((c) => String(c)));
}

const flat = (r: string[][]) => r.map((row) => row.join(" | ")).join("\n");

describe("XLSX de cotización (HU-03)", () => {
  it("DOC-XLS-01 · El endpoint devuelve un Excel válido", async () => {
    const file = await download(`${E}/quotes/${SEED.quoteId}/xlsx`);
    expect(file.status).toBe(200);
    expect(file.type).toBe(XLSX_TYPE);
    expect(file.buffer.subarray(0, 2).toString()).toBe("PK"); // contenedor ZIP de OOXML
    mkdirSync(EVIDENCE, { recursive: true });
    writeFileSync(`${EVIDENCE}/cotizacion-COT-001-2026.xlsx`, file.buffer);
    expect(() => XLSX.read(file.buffer, { type: "buffer" })).not.toThrow();
  });

  it("DOC-XLS-02 · Tiene encabezado, filas por rubro y totales esperados", async () => {
    const file = await download(`${E}/quotes/${SEED.quoteId}/xlsx`);
    const text = flat(rows(file.buffer, "Cotización"));
    expect(text).toContain("COTIZACIÓN: COT-001-2026");
    expect(text).toContain("EVT-0001");
    for (const p of ["Audio", "Iluminación", "Consola digital 32 canales", "Parlante line array", "Cabeza móvil beam"]) {
      expect(text).toContain(p);
    }
    expect(text).toMatch(/Sub-Total \| \$3\.680\.000/);
    expect(text).toMatch(/IVA \(19%\) \| \$665\.000/);
    expect(text).toMatch(/TOTAL \| \$4\.165\.000/);
  });
});

describe("XLSX de orden de servicio (HU-04)", () => {
  it("DOC-XLS-03 · Tiene consecutivo, rubro, ítems y total de servicios", async () => {
    const file = await download(`${E}/orders/${SEED.orderId}/xlsx`);
    expect(file.status).toBe(200);
    writeFileSync(`${EVIDENCE}/orden-OS-001-2026.xlsx`, file.buffer);
    const text = flat(rows(file.buffer, "Orden de Servicio"));
    expect(text).toContain("OS-001-2026");
    expect(text).toContain("AUDIO");
    expect(text).toContain("Parlante line array");
    expect(text).toMatch(/TOTAL SERVICIOS/);
    expect(text).toContain("$1.400.000");
  });
});

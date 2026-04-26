import ExcelJS from "exceljs";
import type { Quote, ServiceOrder, MagikEvent, DocumentItem } from "@/lib/types";

const CR = "FFD4004E"; // CRIMSON ARGB
const GH = "FFE8E8E8"; // GRAY_HDR
const RB = "FFF5F5F5"; // RUBRO_BG
const WH = "FFFFFFFF"; // WHITE

function formatCOP(value: number): string {
  return "$" + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}/${dateStr.split("-")[0]}`;
}

function crimsonHeader(cell: ExcelJS.Cell, text: string, center = false) {
  cell.value = text;
  cell.font = { bold: true, color: { argb: WH }, size: 9 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CR } };
  cell.alignment = { horizontal: center ? "center" : "left", vertical: "middle", wrapText: false };
  cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
}

function thinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } },
  };
}

export async function buildQuoteXlsx(quote: Quote, event: MagikEvent): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MAGIK Producciones";

  const ws = wb.addWorksheet("Cotización");
  ws.columns = [
    { width: 30 }, // A — CONCEPTO
    { width: 42 }, // B — ITEM
    { width: 12 }, // C — CANT.
  ];

  // ── 1. Title block ────────────────────────────────────────────────────────────
  ws.mergeCells("A1:C1");
  const t1 = ws.getCell("A1");
  t1.value = "MAGIK PRODUCCIONES — Producción Técnica de Eventos";
  t1.font = { bold: true, size: 13, color: { argb: CR } };
  t1.alignment = { horizontal: "center" };
  ws.getRow(1).height = 26;

  ws.mergeCells("A2:C2");
  const t2 = ws.getCell("A2");
  t2.value = `COTIZACIÓN: ${quote.consecutive ?? quote.title}`;
  t2.font = { bold: true, size: 11 };
  t2.alignment = { horizontal: "center" };
  ws.getRow(2).height = 20;

  ws.mergeCells("A3:C3");
  const t3 = ws.getCell("A3");
  t3.value = `Cliente: ${event.clientName}  |  Evento: ${event.consecutive}  |  Fecha: ${formatDate(event.date)}`;
  t3.font = { size: 9, color: { argb: "FF555555" } };
  t3.alignment = { horizontal: "center" };

  ws.addRow([]); // row 4 spacer

  // ── 2. Table header ───────────────────────────────────────────────────────────
  ws.getRow(5).height = 18;
  crimsonHeader(ws.getRow(5).getCell(1), "CONCEPTO", true);
  crimsonHeader(ws.getRow(5).getCell(2), "ITEM", true);
  crimsonHeader(ws.getRow(5).getCell(3), "CANT.", true);

  // ── 3. Items grouped by rubro ─────────────────────────────────────────────────
  const grupos = new Map<string, DocumentItem[]>();
  for (const item of quote.items) {
    if (!grupos.has(item.rubroName)) grupos.set(item.rubroName, []);
    grupos.get(item.rubroName)!.push(item);
  }

  let rowIdx = 6;
  for (const [rubro, prods] of Array.from(grupos.entries())) {
    const startRow = rowIdx;
    for (let i = 0; i < prods.length; i++) {
      const prod = prods[i];
      const row = ws.getRow(rowIdx);
      if (i === 0) {
        row.getCell(1).value = rubro;
        row.getCell(1).font = { bold: true, size: 9, color: { argb: CR } };
        row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: RB } };
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      }
      row.getCell(2).value = prod.productName;
      row.getCell(2).font = { size: 9 };
      row.getCell(3).value = prod.quantity > 0 ? prod.quantity : "-";
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(3).font = { size: 9 };
      thinBorder(row.getCell(1));
      thinBorder(row.getCell(2));
      thinBorder(row.getCell(3));
      rowIdx++;
    }
    if (prods.length > 1) {
      ws.mergeCells(startRow, 1, rowIdx - 1, 1);
    }
  }

  ws.addRow([]); // spacer

  // ── 4. Financial summary ───────────────────────────────────────────────────────
  const subtotal = quote.items.reduce((s, i) => s + i.total, 0);
  const descuento = quote.discount ?? 0;
  const subtotalConDescuento = subtotal - descuento;
  const iva = quote.hasIva ? Math.round(subtotalConDescuento * 0.19) : 0;
  const total = subtotalConDescuento + iva;

  function addFinRow(label: string, value: string, bold = false, isCrimson = false) {
    const row = ws.addRow(["", label, value]);
    row.getCell(2).font = { bold, size: 9, color: isCrimson ? { argb: CR } : undefined };
    row.getCell(3).font = { bold, size: 9, color: isCrimson ? { argb: CR } : undefined };
    row.getCell(3).alignment = { horizontal: "right" };
  }

  addFinRow("Sub-Total", formatCOP(subtotal), true);
  if (descuento > 0) {
    addFinRow("Descuento Comercial", `- ${formatCOP(descuento)}`, false, true);
    addFinRow("Sub-Total c/Descuento", formatCOP(subtotalConDescuento), true);
  }
  if (quote.hasIva) {
    addFinRow("IVA (19%)", formatCOP(iva), false, true);
  }

  const totalRow = ws.addRow(["", "TOTAL", formatCOP(total)]);
  totalRow.getCell(2).font = { bold: true, size: 13, color: { argb: CR } };
  totalRow.getCell(3).font = { bold: true, size: 13, color: { argb: CR } };
  totalRow.getCell(3).alignment = { horizontal: "right" };
  totalRow.getCell(2).border = { top: { style: "medium", color: { argb: CR } } };
  totalRow.getCell(3).border = { top: { style: "medium", color: { argb: CR } } };

  // ── 5. Notes ──────────────────────────────────────────────────────────────────
  const hasNotes = quote.additionalNotes || quote.observations || quote.notes;
  if (hasNotes) {
    ws.addRow([]);
    if (quote.additionalNotes) {
      const r = ws.addRow(["Notas:", quote.additionalNotes]);
      r.getCell(1).font = { bold: true, size: 9 };
    }
    if (quote.observations) {
      const r = ws.addRow(["Observaciones:", quote.observations]);
      r.getCell(1).font = { bold: true, size: 9 };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

export async function buildOrderXlsx(order: ServiceOrder, event: MagikEvent): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MAGIK Producciones";

  const ws = wb.addWorksheet("Orden de Servicio");
  ws.columns = [
    { width: 6 },  // A — #
    { width: 22 }, // B — RUBRO
    { width: 34 }, // C — DESCRIPCIÓN
    { width: 10 }, // D — UND
    { width: 8 },  // E — CANT.
    { width: 17 }, // F — V.UNITARIO
    { width: 17 }, // G — V.TOTAL
  ];

  // ── 1. Title block ────────────────────────────────────────────────────────────
  ws.mergeCells("A1:G1");
  const t1 = ws.getCell("A1");
  t1.value = "MAGIK PRODUCCIONES — ORDEN DE SERVICIO";
  t1.font = { bold: true, size: 13, color: { argb: CR } };
  t1.alignment = { horizontal: "center" };
  ws.getRow(1).height = 26;

  ws.mergeCells("A2:G2");
  const t2 = ws.getCell("A2");
  t2.value = order.orderConsecutive ?? order.title;
  t2.font = { bold: true, size: 11 };
  t2.alignment = { horizontal: "center" };

  // ── 2. Provider / event info ──────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const infoData: [string, string, string, string][] = [
    ["PROVEEDOR", order.providerName, "FECHA MONTAJE", order.fechaMontaje ? formatDate(order.fechaMontaje) : ""],
    ["NIT", order.nitProveedor ?? "", "HORA MONTAJE", order.horaMontaje ?? ""],
    ["RAZÓN SOCIAL", order.razonSocial ?? "", "FECHA EVENTO", formatDate(order.fechaEvento ?? event.date)],
    ["CONTACTO", order.contactoProveedor ?? "", "HORA EJECUCIÓN", order.horaEjecucion ?? ""],
    ["EMAIL", order.emailProveedor ?? "", "DÍA PRUEBA", order.diaPrueba ? formatDate(order.diaPrueba) : ""],
    ["CELULAR", order.celularProveedor ?? "", "HORA PRUEBA", order.horaPrueba ?? ""],
    ["CLIENTE", event.clientName, "LUGAR", event.place],
    ["EVENTO", event.consecutive, "FECHA ORDEN", formatDate(today)],
  ];

  let r = 3;
  for (const [l1, v1, l2, v2] of infoData) {
    ws.mergeCells(r, 2, r, 3);
    ws.mergeCells(r, 5, r, 7);
    const row = ws.getRow(r);
    const setLabel = (cell: ExcelJS.Cell, text: string) => {
      cell.value = text;
      cell.font = { bold: true, size: 8 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GH } };
    };
    setLabel(row.getCell(1), l1);
    row.getCell(2).value = v1;
    row.getCell(2).font = { size: 9 };
    setLabel(row.getCell(4), l2);
    row.getCell(5).value = v2;
    row.getCell(5).font = { size: 9 };
    r++;
  }

  ws.addRow([]); // spacer
  r++;

  // ── 3. Items table header ─────────────────────────────────────────────────────
  const hRow = ws.getRow(r);
  hRow.height = 18;
  crimsonHeader(hRow.getCell(1), "#", true);
  crimsonHeader(hRow.getCell(2), "RUBRO");
  crimsonHeader(hRow.getCell(3), "DESCRIPCIÓN");
  crimsonHeader(hRow.getCell(4), "UND", true);
  crimsonHeader(hRow.getCell(5), "CANT.", true);
  crimsonHeader(hRow.getCell(6), "V.UNITARIO");
  crimsonHeader(hRow.getCell(7), "V.TOTAL");
  r++;

  // ── 4. Items grouped by rubro ─────────────────────────────────────────────────
  const grupos = new Map<string, DocumentItem[]>();
  for (const item of order.items) {
    if (!grupos.has(item.rubroName)) grupos.set(item.rubroName, []);
    grupos.get(item.rubroName)!.push(item);
  }

  let num = 1;
  for (const [rubroName, prods] of Array.from(grupos.entries())) {
    // Rubro subheader
    ws.mergeCells(r, 1, r, 7);
    const rubroRow = ws.getRow(r);
    rubroRow.getCell(1).value = rubroName.toUpperCase();
    rubroRow.getCell(1).font = { bold: true, size: 8, color: { argb: CR } };
    rubroRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: RB } };
    r++;

    for (const prod of prods) {
      const row = ws.getRow(r);
      row.getCell(1).value = num++;
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(2).value = rubroName;
      row.getCell(3).value = prod.productName;
      row.getCell(4).value = prod.unit;
      row.getCell(4).alignment = { horizontal: "center" };
      row.getCell(5).value = prod.quantity;
      row.getCell(5).alignment = { horizontal: "center" };
      row.getCell(6).value = formatCOP(prod.unitPrice);
      row.getCell(6).alignment = { horizontal: "right" };
      row.getCell(7).value = formatCOP(prod.total);
      row.getCell(7).alignment = { horizontal: "right" };
      for (let c = 1; c <= 7; c++) {
        row.getCell(c).font = { size: 9 };
        row.getCell(c).border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
      }
      r++;
    }
  }

  // ── 5. Total ──────────────────────────────────────────────────────────────────
  ws.addRow([]);
  r++;
  const totalItems = order.items.reduce((s, i) => s + i.total, 0);
  ws.mergeCells(r, 1, r, 6);
  const totalRow = ws.getRow(r);
  totalRow.getCell(1).value = "TOTAL SERVICIOS";
  totalRow.getCell(1).font = { bold: true, size: 10 };
  totalRow.getCell(7).value = formatCOP(totalItems);
  totalRow.getCell(7).font = { bold: true, size: 10, color: { argb: CR } };
  totalRow.getCell(7).alignment = { horizontal: "right" };
  totalRow.getCell(1).border = { top: { style: "medium", color: { argb: CR } } };
  totalRow.getCell(7).border = { top: { style: "medium", color: { argb: CR } } };

  // ── 6. Payment ────────────────────────────────────────────────────────────────
  const hasPayment = order.anticipo || order.abono2 || order.credito || order.saldo;
  if (hasPayment) {
    r++;
    ws.addRow([]);
    r++;

    ws.mergeCells(r, 1, r, 7);
    const payHdr = ws.getRow(r);
    payHdr.getCell(1).value = "FORMA DE PAGO";
    payHdr.getCell(1).font = { bold: true, size: 9, color: { argb: WH } };
    payHdr.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CR } };
    payHdr.getCell(1).alignment = { horizontal: "center" };
    r++;

    const addPayRow = (label: string, value: number, fecha: string) => {
      ws.mergeCells(r, 1, r, 5);
      const row = ws.getRow(r);
      row.getCell(1).value = label;
      row.getCell(1).font = { size: 9 };
      row.getCell(6).value = formatCOP(value);
      row.getCell(6).font = { size: 9 };
      row.getCell(6).alignment = { horizontal: "right" };
      row.getCell(7).value = fecha;
      row.getCell(7).font = { size: 9 };
      r++;
    };

    if (order.anticipo) addPayRow("ANTICIPO", order.anticipoValor ?? 0, order.anticipoFecha ? formatDate(order.anticipoFecha) : "");
    if (order.abono2) addPayRow("ABONO 2", order.abono2, order.fechaAbono2 ? formatDate(order.fechaAbono2) : "");
    if (order.credito) addPayRow("CRÉDITO / SALDO", order.creditoValor ?? order.saldo ?? 0, order.fechaPago ? formatDate(order.fechaPago) : "");
    if (order.saldo && !order.credito) addPayRow("SALDO", order.saldo, order.fechaSaldo ? formatDate(order.fechaSaldo) : "");
  }

  // ── 7. Observations ───────────────────────────────────────────────────────────
  if (order.observations || order.notes) {
    ws.addRow([]);
    if (order.observations) {
      const row = ws.addRow(["OBSERVACIONES", order.observations]);
      row.getCell(1).font = { bold: true, size: 9, color: { argb: CR } };
    }
    if (order.notes) {
      const row = ws.addRow(["", order.notes]);
      row.getCell(2).font = { size: 9 };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}

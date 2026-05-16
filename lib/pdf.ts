import fs from "fs";
import path from "path";
import sharp from "sharp";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");
import { ROBOTO_FONTS } from "./pdf-fonts";
import type { Quote, ServiceOrder, MagikEvent, DocumentItem } from "./types";

const CRIMSON = "#D4004E";
const ASSETS = path.join(process.cwd(), "public/assets");
const PAGE_WIDTH = 515; // A4 width minus 40px margins each side

function formatCOP(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-CO");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

async function svgToPng(svgPath: string, width: number): Promise<Buffer> {
  const svg = fs.readFileSync(svgPath);
  return sharp(svg).resize({ width }).png().toBuffer();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePrinter(): any {
  return new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 60, left: 40, right: 40 },
    bufferPages: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectBuffer(doc: any): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerFonts(doc: any) {
  doc.registerFont("Roboto", Buffer.from(ROBOTO_FONTS.regular, "base64"));
  doc.registerFont("Roboto-Bold", Buffer.from(ROBOTO_FONTS.medium, "base64"));
  doc.registerFont("Roboto-Italic", Buffer.from(ROBOTO_FONTS.italic, "base64"));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawFooter(doc: any) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .fillColor(CRIMSON)
      .text("WWW.MAGIKENTER.COM", 40, 780, { width: PAGE_WIDTH, align: "center" });
    doc
      .font("Roboto")
      .fontSize(8)
      .fillColor("#888888")
      .text(
        "Calle 8 A No. 23-22 B. Alameda - Cali, Colombia | PBX: +57 524 5813 +57 488 5251",
        40, 800, { width: PAGE_WIDTH, align: "center" }
      );
  }
}

export async function buildQuotePdf(quote: Quote, event: MagikEvent): Promise<Buffer> {
  const logoPng = await svgToPng(path.join(ASSETS, "logo_magik.svg"), 300);
  const firmaPng = await svgToPng(path.join(ASSETS, "firma_londoño.svg"), 200);

  const doc = makePrinter();
  const bufferReady = collectBuffer(doc);

  registerFonts(doc);

  // ── 1. HEADER: logo + número cotización ──────────────────────────────────
  doc.image(logoPng, 40, 40, { width: 120 });
  doc
    .rect(390, 40, 165, 28)
    .stroke("#000000");
  doc
    .font("Roboto-Bold")
    .fontSize(10)
    .fillColor("#000000")
    .text(quote.consecutive ?? quote.title, 395, 48, { width: 155, align: "center" });

  // ── 2. FECHA Y DESTINATARIO ───────────────────────────────────────────────
  const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const now = new Date();
  const fechaLarga = `${now.getDate()} de ${MONTHS[now.getMonth()]} de ${now.getFullYear()}`;

  doc
    .font("Roboto")
    .fontSize(10)
    .fillColor("#000000")
    .text(`Santiago de Cali, ${fechaLarga}`, 40, 100);
  doc.moveDown(0.4);
  doc.text("Señores");
  doc.font("Roboto-Bold").text(event.clientName);
  doc.font("Roboto");
  if (quote.attention) doc.text(`Atn. ${quote.attention}`);
  if (quote.attentionRole) doc.text(quote.attentionRole);
  doc.text("L.C");
  doc.moveDown(0.4);
  doc
    .font("Roboto-Bold")
    .text("ASUNTO. ", { continued: true })
    .text("COTIZACIÓN ", { continued: true })
    .text(quote.subject || quote.title || "");

  doc.moveDown(0.5);

  // ── 3. RECUADRO EVENTO ────────────────────────────────────────────────────
  const boxY = doc.y;
  doc.rect(40, boxY, PAGE_WIDTH, 66).fillAndStroke("#f9f9f9", "#cccccc");
  doc.fillColor("#000000");

  let infoY = boxY + 8;
  doc.font("Roboto-Bold").fontSize(9).text("Lugar & Ciudad:", 48, infoY, { continued: true });
  doc.font("Roboto").fillColor(CRIMSON).text(`  ${event.place}`);
  infoY += 16;
  doc.font("Roboto-Bold").fillColor("#000000").text("Fecha de Evento:", 48, infoY, { continued: true });
  doc.font("Roboto").fillColor(CRIMSON).text(`  ${formatDate(event.date)}`);
  infoY += 16;
  if (quote.assemblyDate) {
    doc.font("Roboto-Bold").fillColor("#000000").text("Fecha de Montaje:", 48, infoY, { continued: true });
    doc.font("Roboto").fillColor(CRIMSON).text(
      `  ${formatDate(quote.assemblyDate)}${quote.assemblyTime ? " | " + quote.assemblyTime : ""}`
    );
    infoY += 16;
  }
  if (quote.testDate) {
    doc.font("Roboto-Bold").fillColor("#000000").text("Pruebas:", 48, infoY, { continued: true });
    doc.font("Roboto").fillColor(CRIMSON).text(
      `  ${formatDate(quote.testDate)}${quote.testTime ? " | " + quote.testTime : ""}`
    );
  }

  doc.y = boxY + 74;
  doc.fillColor("#000000");

  // ── 4. TABLA EQUIPOS (CONCEPTO | ITEM | CANT.) ───────────────────────────
  doc.moveDown(0.5);
  const ROW_H = 20;
  const COL_WIDTHS = [170, 300, 45];
  let tableY = doc.y;

  // Header
  doc.rect(40, tableY, PAGE_WIDTH, ROW_H).fill("#f0f0f0");
  doc.rect(40, tableY, PAGE_WIDTH, ROW_H).stroke("#cccccc");
  doc.font("Roboto-Bold").fontSize(9).fillColor("#000000");
  doc.text("CONCEPTO", 45, tableY + 6, { width: COL_WIDTHS[0] - 10, align: "center" });
  doc.text("ITEM", 45 + COL_WIDTHS[0], tableY + 6, { width: COL_WIDTHS[1] - 10 });
  doc.text("CANT.", 45 + COL_WIDTHS[0] + COL_WIDTHS[1], tableY + 6, { width: COL_WIDTHS[2] - 5, align: "center" });
  tableY += ROW_H;

  // Rows agrupados por rubro
  const grupos = new Map<string, DocumentItem[]>();
  for (const item of quote.items) {
    if (!grupos.has(item.rubroName)) grupos.set(item.rubroName, []);
    grupos.get(item.rubroName)!.push(item);
  }

  doc.font("Roboto").fontSize(9).fillColor("#000000");
  for (const [rubro, prods] of Array.from(grupos.entries())) {
    prods.forEach((prod: DocumentItem, i: number) => {
      const qty = prod.quantity > 0 ? String(prod.quantity) : "-";
      doc.rect(40, tableY, PAGE_WIDTH, ROW_H).stroke("#cccccc");
      if (i === 0) {
        doc.rect(40, tableY, COL_WIDTHS[0], ROW_H * prods.length).stroke("#cccccc");
        doc.font("Roboto").text(rubro, 45, tableY + 6, { width: COL_WIDTHS[0] - 10, align: "center" });
      }
      doc.text(prod.productName, 45 + COL_WIDTHS[0], tableY + 6, { width: COL_WIDTHS[1] - 10 });
      doc.text(qty, 45 + COL_WIDTHS[0] + COL_WIDTHS[1], tableY + 6, { width: COL_WIDTHS[2] - 5, align: "center" });
      tableY += ROW_H;
    });
  }

  // Adición sin costo
  if (quote.hasAddition && quote.additionItems?.length) {
    doc.y = tableY + 6;
    doc.font("Roboto-Bold").fontSize(9).fillColor(CRIMSON).text("ADICIÓN - SIN COSTO", 40, doc.y);
    doc.moveDown(0.3);
    tableY = doc.y;

    const addGrupos = new Map<string, DocumentItem[]>();
    for (const item of quote.additionItems) {
      if (!addGrupos.has(item.rubroName)) addGrupos.set(item.rubroName, []);
      addGrupos.get(item.rubroName)!.push(item);
    }

    doc.font("Roboto").fontSize(9).fillColor("#000000");
    for (const [rubro, prods] of Array.from(addGrupos.entries())) {
      prods.forEach((prod: DocumentItem, i: number) => {
        const qty = prod.quantity > 0 ? String(prod.quantity) : "-";
        doc.rect(40, tableY, PAGE_WIDTH, ROW_H).stroke("#cccccc");
        if (i === 0) {
          doc.rect(40, tableY, COL_WIDTHS[0], ROW_H * prods.length).stroke("#cccccc");
          doc.text(rubro, 45, tableY + 6, { width: COL_WIDTHS[0] - 10, align: "center" });
        }
        doc.text(prod.productName, 45 + COL_WIDTHS[0], tableY + 6, { width: COL_WIDTHS[1] - 10 });
        doc.text(qty, 45 + COL_WIDTHS[0] + COL_WIDTHS[1], tableY + 6, { width: COL_WIDTHS[2] - 5, align: "center" });
        tableY += ROW_H;
      });
    }
  }

  doc.y = tableY + 10;

  // ── 5. PROPUESTA ECONÓMICA ────────────────────────────────────────────────
  const subtotal = quote.items.reduce((s, i) => s + i.total, 0);
  const descuento = quote.discount ?? 0;
  const subtotalDesc = subtotal - descuento;
  const iva = quote.hasIva ? Math.round(subtotalDesc * 0.19) : 0;
  const total = subtotalDesc + iva;

  const propX = 300;
  const propLabelW = 130;
  const propValW = 85;

  doc.font("Roboto-Bold").fontSize(9).fillColor("#000000")
    .text("Sub-Total", propX, doc.y, { width: propLabelW });
  doc.text(formatCOP(subtotal), propX + propLabelW, doc.y - doc.currentLineHeight(), { width: propValW, align: "right" });

  if (descuento > 0) {
    doc.font("Roboto").fillColor(CRIMSON)
      .text("Descuento Comercial", propX, doc.y, { width: propLabelW });
    doc.text(`- ${formatCOP(descuento)}`, propX + propLabelW, doc.y - doc.currentLineHeight(), { width: propValW, align: "right" });
    doc.font("Roboto-Bold").fillColor("#000000")
      .text("Sub-Total c/Descuento", propX, doc.y, { width: propLabelW });
    doc.text(formatCOP(subtotalDesc), propX + propLabelW, doc.y - doc.currentLineHeight(), { width: propValW, align: "right" });
  }

  if (quote.hasIva) {
    doc.font("Roboto").fillColor(CRIMSON)
      .text("IVA (19%)", propX, doc.y, { width: propLabelW });
    doc.text(formatCOP(iva), propX + propLabelW, doc.y - doc.currentLineHeight(), { width: propValW, align: "right" });
  }

  doc.moveTo(propX, doc.y).lineTo(propX + propLabelW + propValW, doc.y).stroke("#cccccc");
  doc.font("Roboto-Bold").fontSize(13).fillColor(CRIMSON)
    .text("TOTAL", propX, doc.y + 2, { width: propLabelW });
  doc.text(formatCOP(total), propX + propLabelW, doc.y - doc.currentLineHeight(), { width: propValW, align: "right" });

  doc.moveDown(1.5);
  doc.fillColor("#000000");

  // Notas opcionales
  if (quote.paymentTerms) {
    doc.font("Roboto-Bold").fontSize(9).fillColor(CRIMSON).text("i. FORMA DE PAGO");
    doc.font("Roboto").fillColor("#000000").fontSize(9).text(`- ${quote.paymentTerms}`);
    doc.moveDown(0.5);
  }
  if (quote.additionalNotes) {
    doc.font("Roboto-Bold").fontSize(9).fillColor(CRIMSON).text("ii. NOTAS ADICIONALES");
    doc.font("Roboto").fillColor("#000000").fontSize(9).text(`- ${quote.additionalNotes}`);
    doc.moveDown(0.5);
  }
  if (quote.observations) {
    doc.font("Roboto-Bold").fontSize(9).fillColor(CRIMSON).text("iii. OBSERVACIONES");
    doc.font("Roboto").fillColor("#000000").fontSize(9).text(`- ${quote.observations}`);
    doc.moveDown(0.5);
  }

  // ── 6. CIERRE ─────────────────────────────────────────────────────────────
  doc.moveDown(1);
  doc.font("Roboto").fontSize(10).text("Esperando su pronta respuesta,");
  doc.moveDown(1);
  const firmaY = doc.y;
  doc.image(firmaPng, 40, firmaY, { width: 100 });
  doc.y = firmaY + 55;
  doc.moveTo(40, doc.y).lineTo(240, doc.y).stroke("#888888");
  doc.moveDown(0.3);
  doc.font("Roboto-Bold").fontSize(10).fillColor("#000000").text("JUAN CARLOS LONDOÑO H.");
  doc.font("Roboto").fontSize(9).fillColor("#555555")
    .text("CEO & Founder")
    .text("TTS GROUP S.A.S")
    .text("NIT: 901.768.072")
    .text("M: +57 317 595 8405")
    .text("E: gerencia@magikenter.com");

  drawFooter(doc);
  doc.end();
  return bufferReady;
}

export async function buildOrderPdf(order: ServiceOrder, event: MagikEvent): Promise<Buffer> {
  const logoPng = await svgToPng(path.join(ASSETS, "logo_magik.svg"), 300);
  const firmaPng = await svgToPng(path.join(ASSETS, "firma_londoño.svg"), 200);

  const doc = makePrinter();
  const bufferReady = collectBuffer(doc);

  registerFonts(doc);

  const GRAY_HDR = "#E8E8E8";
  const PINK_BG  = "#FFE0E0";
  const ROW_H    = 18;

  // ── 1. HEADER ─────────────────────────────────────────────────────────────
  doc.image(logoPng, 40, 40, { width: 100 });
  doc
    .font("Roboto-Bold").fontSize(13).fillColor(CRIMSON)
    .text("MAGIK PRODUCCIONES", 150, 40, { width: PAGE_WIDTH - 110, align: "right" });
  doc
    .font("Roboto").fontSize(8).fillColor("#666666")
    .text("Producción Técnica de Eventos", 150, 58, { width: PAGE_WIDTH - 110, align: "right" })
    .text("Cali, Colombia", 150, 68, { width: PAGE_WIDTH - 110, align: "right" });

  // Banner ORDEN DE SERVICIO
  doc.rect(40, 85, PAGE_WIDTH, 22).fill(CRIMSON);
  doc.font("Roboto-Bold").fontSize(11).fillColor("#FFFFFF")
    .text("ORDEN DE SERVICIO", 40, 91, { width: PAGE_WIDTH, align: "center" });

  doc
    .font("Roboto-Bold").fontSize(14).fillColor(CRIMSON)
    .text(order.orderConsecutive ?? order.title, 40, 114, { width: PAGE_WIDTH, align: "center" });

  // ── 2. GRID DE DATOS ──────────────────────────────────────────────────────
  const COL = [85, PAGE_WIDTH / 2 - 85, 90, PAGE_WIDTH / 2 - 90];
  const gridRows: [string, string, string, string][] = [
    ["PROVEEDOR:",      order.providerName,             "FECHA MONTAJE:",  order.fechaMontaje ? formatDate(order.fechaMontaje) : ""],
    ["NIT:",           order.nitProveedor ?? "",         "HORA MONTAJE:",   order.horaMontaje ?? ""],
    ["RAZÓN SOCIAL:",  order.razonSocial ?? "",          "FECHA EVENTO:",   order.fechaEvento ? formatDate(order.fechaEvento) : formatDate(event.date)],
    ["CONTACTO:",      order.contactoProveedor ?? "",    "HORA EJECUCIÓN:", order.horaEjecucion ?? ""],
    ["EMAIL:",         order.emailProveedor ?? "",       "DÍA PRUEBA:",     order.diaPrueba ? formatDate(order.diaPrueba) : ""],
    ["CELULAR:",       order.celularProveedor ?? "",     "HORA PRUEBA:",    order.horaPrueba ?? ""],
    ["TIPO SERVICIO:", order.tipoServicio ?? "",         "EVENTO:",         event.consecutive],
    ["CLIENTE:",       event.clientName,                 "LUGAR:",          event.place],
    ["FECHA ORDEN:",   formatDate(new Date().toISOString().slice(0, 10)), "ORDEN #:", order.orderConsecutive ?? ""],
  ];

  let gy = 136;
  gridRows.forEach((row, idx) => {
    const isPink = idx >= 7;
    const bg = isPink ? PINK_BG : "#FFFFFF";
    const hdrBg = isPink ? PINK_BG : GRAY_HDR;

    let gx = 40;
    [0, 1, 2, 3].forEach((ci) => {
      const w = COL[ci];
      const isLabel = ci % 2 === 0;
      doc.rect(gx, gy, w, ROW_H).fillAndStroke(isLabel ? hdrBg : bg, "#cccccc");
      doc
        .font(isLabel ? "Roboto-Bold" : "Roboto")
        .fontSize(8)
        .fillColor("#000000")
        .text(row[ci], gx + 3, gy + 5, { width: w - 6 });
      gx += w;
    });
    gy += ROW_H;
  });

  // ── 3. TABLA SERVICIOS ────────────────────────────────────────────────────
  gy += 8;
  doc.font("Roboto-Bold").fontSize(9).fillColor(CRIMSON)
    .text("DETALLE DE SERVICIOS", 40, gy);
  gy += 14;

  const SVC_COLS = [18, 60, PAGE_WIDTH - 18 - 60 - 28 - 28 - 52 - 52, 28, 28, 52, 52];
  const SVC_HDRS = ["#", "RUBRO", "DESCRIPCIÓN", "UND", "CANT.", "V.UNITARIO", "V.TOTAL"];

  let sx = 40;
  SVC_HDRS.forEach((h, i) => {
    doc.rect(sx, gy, SVC_COLS[i], ROW_H).fill(CRIMSON);
    doc.rect(sx, gy, SVC_COLS[i], ROW_H).stroke(CRIMSON);
    doc.font("Roboto-Bold").fontSize(8).fillColor("#FFFFFF")
      .text(h, sx + 2, gy + 5, { width: SVC_COLS[i] - 4, align: i >= 3 ? "right" : "center" });
    sx += SVC_COLS[i];
  });
  gy += ROW_H;

  const svcGrupos = new Map<string, DocumentItem[]>();
  for (const item of order.items) {
    if (!svcGrupos.has(item.rubroName)) svcGrupos.set(item.rubroName, []);
    svcGrupos.get(item.rubroName)!.push(item);
  }

  let itemNum = 1;
  doc.font("Roboto").fontSize(8).fillColor("#000000");
  for (const [rubroName, prods] of Array.from(svcGrupos.entries())) {
    // Fila cabecera de rubro
    doc.rect(40, gy, PAGE_WIDTH, ROW_H).fill("#F5F5F5");
    doc.rect(40, gy, PAGE_WIDTH, ROW_H).stroke("#cccccc");
    doc.font("Roboto-Bold").fontSize(8).fillColor(CRIMSON)
      .text(rubroName.toUpperCase(), 43, gy + 5);
    gy += ROW_H;

    for (const prod of prods) {
      sx = 40;
      const rowData = [
        String(itemNum++),
        rubroName,
        prod.productName,
        prod.unit,
        String(prod.quantity),
        formatCOP(prod.unitPrice),
        formatCOP(prod.total),
      ];
      rowData.forEach((val, i) => {
        doc.rect(sx, gy, SVC_COLS[i], ROW_H).stroke("#cccccc");
        doc.font("Roboto").fontSize(8).fillColor("#000000")
          .text(val, sx + 2, gy + 5, { width: SVC_COLS[i] - 4, align: i >= 3 ? "right" : "left" });
        sx += SVC_COLS[i];
      });
      gy += ROW_H;
    }
  }

  // Total servicios
  const totalItems = order.items.reduce((s, i) => s + i.total, 0);
  doc.font("Roboto-Bold").fontSize(10).fillColor("#000000")
    .text("TOTAL SERVICIOS", 200, gy + 4, { width: 200, align: "right" });
  doc.fillColor(CRIMSON)
    .text(formatCOP(totalItems), 405, gy + 4, { width: 150, align: "right" });
  gy += ROW_H + 12;

  // ── 4. FORMA DE PAGO ──────────────────────────────────────────────────────
  const hasPayment = order.anticipo || order.abono2 || order.credito || order.saldo;
  if (hasPayment) {
    doc.rect(40, gy, PAGE_WIDTH, ROW_H).fill(CRIMSON);
    doc.font("Roboto-Bold").fontSize(9).fillColor("#FFFFFF")
      .text("FORMA DE PAGO", 40, gy + 5, { width: PAGE_WIDTH, align: "center" });
    gy += ROW_H;

    const PAY_COLS = [PAGE_WIDTH * 0.35, PAGE_WIDTH * 0.2, PAGE_WIDTH * 0.25, PAGE_WIDTH * 0.2];
    const payHdrs = ["CONCEPTO", "VALOR", "FECHA", ""];
    sx = 40;
    payHdrs.forEach((h, i) => {
      doc.rect(sx, gy, PAY_COLS[i], ROW_H).fillAndStroke(GRAY_HDR, "#cccccc");
      doc.font("Roboto-Bold").fontSize(8).fillColor("#000000").text(h, sx + 3, gy + 5, { width: PAY_COLS[i] - 6 });
      sx += PAY_COLS[i];
    });
    gy += ROW_H;

    const addPayRow = (label: string, value: string, date: string, bg: string) => {
      sx = 40;
      [label, value, date, ""].forEach((v, i) => {
        doc.rect(sx, gy, PAY_COLS[i], ROW_H).fillAndStroke(bg, "#cccccc");
        doc.font("Roboto").fontSize(9).fillColor("#000000").text(v, sx + 3, gy + 5, { width: PAY_COLS[i] - 6 });
        sx += PAY_COLS[i];
      });
      gy += ROW_H;
    };

    if (order.anticipo) addPayRow("ANTICIPO", formatCOP(order.anticipoValor ?? 0), order.anticipoFecha ? formatDate(order.anticipoFecha) : "", PINK_BG);
    if (order.abono2) addPayRow("ABONO 2", formatCOP(order.abono2), order.fechaAbono2 ? formatDate(order.fechaAbono2) : "", "#FFFFFF");
    if (order.credito) addPayRow("CRÉDITO / SALDO", formatCOP(order.creditoValor ?? order.saldo ?? 0), order.fechaPago ? formatDate(order.fechaPago) : "", PINK_BG);
    if (order.saldo && !order.credito) addPayRow("SALDO", formatCOP(order.saldo), order.fechaSaldo ? formatDate(order.fechaSaldo) : "", "#FFFFFF");
    gy += 8;
  }

  // ── 5. OBSERVACIONES ──────────────────────────────────────────────────────
  if (order.observations || order.notes) {
    doc.font("Roboto-Bold").fontSize(8).fillColor(CRIMSON)
      .text("OBSERVACIONES", 40, gy);
    gy += 13;
    const obsText = [order.observations, order.notes].filter(Boolean).join(" / ");
    doc.font("Roboto").fontSize(9).fillColor("#000000").text(obsText, 40, gy, { width: PAGE_WIDTH });
    gy = doc.y + 8;
  }

  // ── 6. IMPORTANTE ─────────────────────────────────────────────────────────
  doc.font("Roboto-Bold").fontSize(8).fillColor(CRIMSON).text("IMPORTANTE:", 40, gy);
  gy += 13;
  const importantes = [
    "Una vez leido este formato se debe enviar confirmacion de recibido al correo de origen.",
    "Porfavor enviar certificacion Bancaria para poder realizar el respectivo anticipo y/o pago.",
    "Toda Cuenta de Cobro presentada ante el solicitante debe estar soportada con esta orden de servicio.",
    "El incumplimiento de los anteriores requisitos acarrea devolucion de la Cuenta de Cobro.",
  ];
  importantes.forEach((item) => {
    doc.font("Roboto").fontSize(8).fillColor("#000000").text(`• ${item}`, 40, gy, { width: PAGE_WIDTH });
    gy += 12;
  });
  gy += 10;

  // ── 7. CIERRE ─────────────────────────────────────────────────────────────
  doc.image(firmaPng, 40, gy, { width: 100 });
  doc.moveTo(40, gy + 68).lineTo(200, gy + 68).stroke("#888888");
  doc.moveTo(300, gy + 68).lineTo(460, gy + 68).stroke("#888888");
  doc.font("Roboto-Bold").fontSize(9).fillColor("#000000")
    .text("JUAN CARLOS LONDOÑO HURTADO", 40, gy + 72);
  doc.font("Roboto").text("CEO & Founder").text("TTS GROUP S.A.S");
  doc.font("Roboto").fontSize(9).fillColor("#888888")
    .text("FIRMA PROVEEDOR", 300, gy + 72);

  drawFooter(doc);
  doc.end();
  return bufferReady;
}

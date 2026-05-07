import fs from "fs";
import path from "path";
import sharp from "sharp";
import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import type { MagikEvent, Quote, ServiceOrder, DocumentItem } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require("pdfmake");

function getFonts() {
  const fontBase = path.join(
    process.cwd(),
    "node_modules/pdfmake/build/fonts/Roboto"
  );
  return {
    Roboto: {
      normal: fs.readFileSync(path.join(fontBase, "Roboto-Regular.ttf")),
      bold: fs.readFileSync(path.join(fontBase, "Roboto-Medium.ttf")),
      italics: fs.readFileSync(path.join(fontBase, "Roboto-Italic.ttf")),
      bolditalics: fs.readFileSync(path.join(fontBase, "Roboto-MediumItalic.ttf")),
    },
  };
}

const printer = new PdfPrinter(getFonts());

function getBuffer(docDef: TDocumentDefinitions): Promise<Buffer> {
  const doc = printer.createPdfKitDocument(docDef);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

const ASSETS = path.join(process.cwd(), "public/assets");
const LOGO_PATH = path.join(ASSETS, "logo_magik.svg");
const FIRMA_PATH = path.join(ASSETS, "firma_londoño.svg");

async function svgToPngDataUrl(svgPath: string, width: number): Promise<string> {
  const png = await sharp(fs.readFileSync(svgPath)).resize({ width }).png().toBuffer();
  return "data:image/png;base64," + png.toString("base64");
}

const CRIMSON = "#D4004E";
const GRAY_HDR = "#E8E8E8";
const RUBRO_BG = "#F5F5F5";
const PINK_BG = "#FFE0E0";

function formatCOP(value: number): string {
  return "$" + Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function today(): string {
  return formatDate(new Date().toISOString().slice(0, 10));
}

function pageFooter(currentPage: number, pageCount: number): Content {
  return {
    columns: [
      { text: "MAGIK Producciones — Producción Técnica de Eventos", fontSize: 7, color: "#888888" },
      { text: `Página ${currentPage} de ${pageCount}`, fontSize: 7, color: "#888888", alignment: "right" },
    ],
    margin: [40, 10, 40, 0],
  };
}

const THIN_BORDER = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => "#cccccc",
  vLineColor: () => "#cccccc",
} as unknown as string;

const BORDER_ONLY = {
  hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
    i === 0 || i === node.table.body.length ? 0.5 : 0,
  vLineWidth: (i: number, node: { table: { widths: unknown[] } }) =>
    i === 0 || i === node.table.widths.length ? 0.5 : 0,
  hLineColor: () => "#cccccc",
  vLineColor: () => "#cccccc",
} as unknown as string;

// Quote items table: CONCEPTO (rubro with rowSpan) | ITEM | CANT.
// Returns the full pdfmake table content object to embed directly in content[].
function buildItemsTable(items: DocumentItem[]): Content {
  const body: object[][] = [
    [
      { text: "CONCEPTO", bold: true, alignment: "center", fillColor: "#f0f0f0", fontSize: 9 },
      { text: "ITEM", bold: true, alignment: "center", fillColor: "#f0f0f0", fontSize: 9 },
      { text: "CANT.", bold: true, alignment: "center", fillColor: "#f0f0f0", fontSize: 9 },
    ],
  ];

  const grupos = new Map<string, DocumentItem[]>();
  for (const item of items) {
    if (!grupos.has(item.rubroName)) grupos.set(item.rubroName, []);
    grupos.get(item.rubroName)!.push(item);
  }

  for (const [rubro, prods] of Array.from(grupos.entries())) {
    prods.forEach((prod: DocumentItem, i: number) => {
      const qty = prod.quantity > 0 ? String(prod.quantity) : "-";
      if (i === 0) {
        body.push([
          { text: rubro, rowSpan: prods.length, alignment: "center", fontSize: 9, margin: [0, 3, 0, 3] },
          { text: prod.productName, fontSize: 9, margin: [4, 3, 4, 3] },
          { text: qty, alignment: "center", fontSize: 9 },
        ]);
      } else {
        body.push([
          {},
          { text: prod.productName, fontSize: 9, margin: [4, 3, 4, 3] },
          { text: qty, alignment: "center", fontSize: 9 },
        ]);
      }
    });
  }

  return {
    table: { headerRows: 1, widths: [170, 300, 70], body },
    layout: THIN_BORDER,
    margin: [0, 0, 0, 16],
  } as unknown as Content;
}

// Order table: #, Rubro (colSpan header), Descripción, Unidad, Cant., V.Unit., V.Total
function buildOrderTableRows(items: DocumentItem[]): TableCell[][] {
  const groups = new Map<string, DocumentItem[]>();
  for (const item of items) {
    const existing = groups.get(item.rubroName) ?? [];
    existing.push(item);
    groups.set(item.rubroName, existing);
  }

  const rows: TableCell[][] = [
    [
      { text: "#", bold: true, fillColor: CRIMSON, color: "#FFFFFF", fontSize: 8, alignment: "center" },
      { text: "RUBRO", bold: true, fillColor: CRIMSON, color: "#FFFFFF", fontSize: 8 },
      { text: "DESCRIPCIÓN", bold: true, fillColor: CRIMSON, color: "#FFFFFF", fontSize: 8 },
      { text: "UND", bold: true, fillColor: CRIMSON, color: "#FFFFFF", fontSize: 8, alignment: "center" },
      { text: "CANT.", bold: true, fillColor: CRIMSON, color: "#FFFFFF", fontSize: 8, alignment: "center" },
      { text: "V.UNITARIO", bold: true, fillColor: CRIMSON, color: "#FFFFFF", fontSize: 8, alignment: "right" },
      { text: "V.TOTAL", bold: true, fillColor: CRIMSON, color: "#FFFFFF", fontSize: 8, alignment: "right" },
    ],
  ];

  let num = 1;
  for (const [rubroName, groupItems] of Array.from(groups.entries())) {
    rows.push([
      { text: rubroName.toUpperCase(), bold: true, colSpan: 7, fillColor: RUBRO_BG, fontSize: 8, color: CRIMSON } as TableCell,
      {} as TableCell, {} as TableCell, {} as TableCell, {} as TableCell, {} as TableCell, {} as TableCell,
    ]);
    for (const item of groupItems) {
      rows.push([
        { text: String(num++), fontSize: 9, alignment: "center" },
        { text: rubroName, fontSize: 8 },
        { text: item.productName, fontSize: 9 },
        { text: item.unit, fontSize: 9, alignment: "center" },
        { text: String(item.quantity), fontSize: 9, alignment: "center" },
        { text: formatCOP(item.unitPrice), fontSize: 9, alignment: "right" },
        { text: formatCOP(item.total), fontSize: 9, alignment: "right" },
      ]);
    }
  }

  return rows;
}

export async function buildQuotePdf(quote: Quote, event: MagikEvent): Promise<Buffer> {
  const [logoDataUrl, firmaDataUrl] = await Promise.all([
    svgToPngDataUrl(LOGO_PATH, 300),
    svgToPngDataUrl(FIRMA_PATH, 200),
  ]);

  const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const now = new Date();
  const fechaLarga = `${now.getDate()} de ${MONTHS[now.getMonth()]} de ${now.getFullYear()}`;

  // Financial calculations — quote.discount is a direct monetary value
  const subtotal = quote.items.reduce((s: number, i: DocumentItem) => s + i.total, 0);
  const descuento = quote.discount ?? 0;
  const subtotalConDescuento = subtotal - descuento;
  const iva = quote.hasIva ? Math.round(subtotalConDescuento * 0.19) : 0;
  const total = subtotalConDescuento + iva;

  type B = [boolean, boolean, boolean, boolean];
  const NB: B = [false, false, false, false];
  const TB: B = [false, true, false, false];

  const finRows: TableCell[][] = [
    [
      { text: "Sub-Total", bold: true, fontSize: 9, border: NB },
      { text: formatCOP(subtotal), bold: true, fontSize: 9, alignment: "right", border: NB },
    ],
  ];
  if (descuento > 0) {
    finRows.push([
      { text: "Descuento Comercial", fontSize: 9, color: CRIMSON, border: NB },
      { text: `- ${formatCOP(descuento)}`, fontSize: 9, alignment: "right", color: CRIMSON, border: NB },
    ]);
    finRows.push([
      { text: "Sub-Total c/Descuento", bold: true, fontSize: 9, border: NB },
      { text: formatCOP(subtotalConDescuento), bold: true, fontSize: 9, alignment: "right", border: NB },
    ]);
  }
  if (quote.hasIva) {
    finRows.push([
      { text: "IVA (19%)", fontSize: 9, color: CRIMSON, border: NB },
      { text: formatCOP(iva), fontSize: 9, alignment: "right", color: CRIMSON, border: NB },
    ]);
  }
  finRows.push([
    { text: "TOTAL", bold: true, fontSize: 13, color: CRIMSON, border: TB },
    { text: formatCOP(total), bold: true, fontSize: 13, alignment: "right", color: CRIMSON, border: TB },
  ]);

  const content: Content[] = [
    // ── 1. Header: logo izquierda + recuadro COT. derecha ──────────────────────
    {
      columns: [
        { image: logoDataUrl, width: 140 },
        {
          table: {
            widths: ["auto"],
            body: [[
              {
                text: quote.consecutive ?? quote.title,
                bold: true,
                fontSize: 10,
                alignment: "right",
                margin: [8, 4, 8, 4],
              },
            ]],
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#000000",
            vLineColor: () => "#000000",
          } as unknown as string,
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 18],
    },

    // ── 2. Datos destinatario ──────────────────────────────────────────────────
    { text: `Santiago de Cali, ${fechaLarga}`, fontSize: 10, margin: [0, 0, 0, 10] },
    { text: "Señores", fontSize: 10, margin: [0, 0, 0, 2] },
    { text: event.clientName, fontSize: 10, bold: true, margin: [0, 0, 0, 2] },
    ...(quote.attention
      ? [{ text: `Atn. ${quote.attention}`, fontSize: 10, margin: [0, 0, 0, 2] } as Content]
      : []),
    ...(quote.attentionRole
      ? [{ text: quote.attentionRole, fontSize: 10, margin: [0, 0, 0, 2] } as Content]
      : []),
    { text: "L.C", fontSize: 10, margin: [0, 0, 0, 10] },
    {
      text: [
        { text: "ASUNTO. ", bold: true, fontSize: 10 },
        { text: "COTIZACIÓN ", fontSize: 10 },
        { text: quote.subject || quote.title, bold: true, fontSize: 10 },
      ],
      margin: [0, 0, 0, 16],
    },

    // ── 3. Recuadro evento ─────────────────────────────────────────────────────
    {
      table: {
        widths: [130, "*"],
        body: [
          [
            { text: "Lugar & Ciudad:", bold: true, fontSize: 9, fillColor: "#f9f9f9" },
            { text: event.place, fontSize: 9, color: CRIMSON, fillColor: "#f9f9f9" },
          ],
          [
            { text: "Fecha de Evento:", bold: true, fontSize: 9, fillColor: "#f9f9f9" },
            { text: formatDate(event.date), fontSize: 9, color: CRIMSON, fillColor: "#f9f9f9" },
          ],
          ...(quote.assemblyDate
            ? [[
                { text: "Fecha de Montaje:", bold: true, fontSize: 9, fillColor: "#f9f9f9" },
                {
                  text: `${formatDate(quote.assemblyDate)}${quote.assemblyTime ? " | " + quote.assemblyTime : ""}`,
                  fontSize: 9,
                  color: CRIMSON,
                  fillColor: "#f9f9f9",
                },
              ]]
            : []),
          ...(quote.testDate
            ? [[
                { text: "Pruebas:", bold: true, fontSize: 9, fillColor: "#f9f9f9" },
                {
                  text: `${formatDate(quote.testDate)}${quote.testTime ? " | " + quote.testTime : ""}`,
                  fontSize: 9,
                  color: CRIMSON,
                  fillColor: "#f9f9f9",
                },
              ]]
            : []),
        ],
      },
      layout: BORDER_ONLY,
      margin: [0, 0, 0, 16],
    },

    // ── 4. Tabla equipos (CONCEPTO | ITEM | CANT.) ────────────────────────────
    buildItemsTable(quote.items),

    // ── 4b. Adición sin costo ─────────────────────────────────────────────────
    ...(quote.hasAddition && quote.additionItems?.length
      ? [
          { text: "ADICIÓN - SIN COSTO", bold: true, fontSize: 9, color: CRIMSON, margin: [0, 0, 0, 6] } as Content,
          buildItemsTable(quote.additionItems),
        ]
      : []),

    // ── 5. Propuesta económica ─────────────────────────────────────────────────
    {
      columns: [
        { text: "", width: "*" },
        {
          table: { widths: [160, 90], body: finRows },
          layout: "noBorders",
          width: 250,
        },
      ],
      margin: [0, 0, 0, 20],
    },

    // ── 6. Cierre ──────────────────────────────────────────────────────────────
    { text: "Esperando su pronta respuesta,", fontSize: 10, margin: [0, 0, 0, 20] },
    { image: firmaDataUrl, width: 100, margin: [0, 0, 0, 4] },
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: "#888888" }],
      margin: [0, 0, 0, 6],
    },
    { text: "JUAN CARLOS LONDOÑO H.", bold: true, fontSize: 10, margin: [0, 0, 0, 2] },
    { text: "CEO & Founder", fontSize: 9, color: "#555555", margin: [0, 0, 0, 1] },
    { text: "TTS GROUP S.A.S", fontSize: 9, color: "#555555", margin: [0, 0, 0, 1] },
    { text: "NIT: 901.768.072", fontSize: 9, color: "#555555", margin: [0, 0, 0, 1] },
    { text: "M: +57 317 595 8405", fontSize: 9, color: "#555555", margin: [0, 0, 0, 1] },
    { text: "E: gerencia@magikenter.com", fontSize: 9, color: "#555555" },
  ];

  const docDef: TDocumentDefinitions = {
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#1A1A1A" },
    pageSize: "A4",
    pageMargins: [28, 40, 27, 70],
    footer: (): Content => ({
      stack: [
        { text: "WWW.MAGIKENTER.COM", fontSize: 14, bold: true, color: CRIMSON, alignment: "center" },
        {
          text: "Calle 8 A No. 23-22 B. Alameda - Cali, Colombia | PBX: +57 524 5813 +57 488 5251",
          fontSize: 8,
          color: "#888888",
          alignment: "center",
        },
      ],
      margin: [40, 8, 40, 0],
    }),
    content,
  };

  return getBuffer(docDef);
}

export async function buildOrderPdf(order: ServiceOrder, event: MagikEvent): Promise<Buffer> {
  const [logoDataUrl, firmaDataUrl] = await Promise.all([
    svgToPngDataUrl(LOGO_PATH, 300),
    svgToPngDataUrl(FIRMA_PATH, 200),
  ]);

  const tableRows = buildOrderTableRows(order.items);
  const totalItems = order.items.reduce((s: number, i: DocumentItem) => s + i.total, 0);

  const content: Content[] = [
    // ── 1. Header ──────────────────────────────────────────────────────────────
    {
      columns: [
        { image: logoDataUrl, width: 100 },
        {
          stack: [
            { text: "MAGIK PRODUCCIONES", fontSize: 13, bold: true, color: CRIMSON, alignment: "right" },
            { text: "Producción Técnica de Eventos", fontSize: 8, color: "#666666", alignment: "right" },
            { text: "Cali, Colombia", fontSize: 8, color: "#666666", alignment: "right" },
          ],
        },
      ],
      margin: [0, 0, 0, 8],
    },
    {
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: "ORDEN DE SERVICIO",
              bold: true,
              fontSize: 11,
              color: "#FFFFFF",
              fillColor: CRIMSON,
              alignment: "center",
              margin: [0, 5, 0, 5],
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 4],
    },

    // ── 2. Order consecutive ────────────────────────────────────────────────────
    {
      text: order.orderConsecutive ?? order.title,
      bold: true,
      fontSize: 14,
      alignment: "center",
      color: CRIMSON,
      margin: [0, 4, 0, 10],
    },

    // ── 3. Data grid (4 columns: label | value | label | value) ─────────────────
    {
      table: {
        widths: [85, "*", 90, "*"],
        body: [
          [
            { text: "PROVEEDOR:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.providerName, fontSize: 9 },
            { text: "FECHA MONTAJE:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.fechaMontaje ? formatDate(order.fechaMontaje) : "", fontSize: 9, bold: true, color: CRIMSON },
          ],
          [
            { text: "NIT:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.nitProveedor ?? "", fontSize: 9 },
            { text: "HORA MONTAJE:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.horaMontaje ?? "", fontSize: 9, color: CRIMSON },
          ],
          [
            { text: "RAZÓN SOCIAL:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.razonSocial ?? "", fontSize: 9 },
            { text: "FECHA EVENTO:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.fechaEvento ? formatDate(order.fechaEvento) : formatDate(event.date), fontSize: 9, bold: true, color: CRIMSON },
          ],
          [
            { text: "CONTACTO:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.contactoProveedor ?? "", fontSize: 9 },
            { text: "HORA EJECUCIÓN:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.horaEjecucion ?? "", fontSize: 9, color: CRIMSON },
          ],
          [
            { text: "EMAIL:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.emailProveedor ?? "", fontSize: 9 },
            { text: "DÍA PRUEBA:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.diaPrueba ? formatDate(order.diaPrueba) : "", fontSize: 9 },
          ],
          [
            { text: "CELULAR:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.celularProveedor ?? "", fontSize: 9 },
            { text: "HORA PRUEBA:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.horaPrueba ?? "", fontSize: 9 },
          ],
          [
            { text: "TIPO SERVICIO:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: order.tipoServicio ?? "", fontSize: 9 },
            { text: "EVENTO:", bold: true, fontSize: 8, fillColor: GRAY_HDR },
            { text: event.consecutive, fontSize: 9, bold: true, color: CRIMSON },
          ],
          [
            { text: "CLIENTE:", bold: true, fontSize: 8, fillColor: PINK_BG },
            { text: event.clientName, fontSize: 9, fillColor: PINK_BG },
            { text: "LUGAR:", bold: true, fontSize: 8, fillColor: PINK_BG },
            { text: event.place, fontSize: 9, fillColor: PINK_BG },
          ],
          [
            { text: "FECHA ORDEN:", bold: true, fontSize: 8, fillColor: PINK_BG },
            { text: today(), fontSize: 9, fillColor: PINK_BG },
            { text: "ORDEN #:", bold: true, fontSize: 8, fillColor: PINK_BG },
            { text: order.orderConsecutive ?? "", fontSize: 9, bold: true, color: CRIMSON, fillColor: PINK_BG },
          ],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    },

    // ── 4. Products table ──────────────────────────────────────────────────────
    { text: "DETALLE DE SERVICIOS", bold: true, fontSize: 9, color: CRIMSON, margin: [0, 0, 0, 4] },
    {
      table: {
        headerRows: 1,
        widths: [18, 60, "*", 28, 28, 52, 52],
        body: tableRows,
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 4],
    },

    // ── 5. Totals ──────────────────────────────────────────────────────────────
    {
      columns: [
        { text: "", width: "*" },
        {
          table: {
            widths: [110, 75],
            body: [
              [
                {
                  text: "TOTAL SERVICIOS",
                  bold: true,
                  fontSize: 10,
                  border: [false, true, false, false] as [boolean, boolean, boolean, boolean],
                },
                {
                  text: formatCOP(totalItems),
                  bold: true,
                  fontSize: 10,
                  alignment: "right",
                  color: CRIMSON,
                  border: [false, true, false, false] as [boolean, boolean, boolean, boolean],
                },
              ],
            ],
          },
          layout: "noBorders",
          width: "auto",
        },
      ],
      margin: [0, 0, 0, 12],
    },
  ];

  // ── 6. Payment table ──────────────────────────────────────────────────────────
  const hasPayment = order.anticipo || order.abono2 || order.credito || order.saldo;
  if (hasPayment) {
    const payRows: TableCell[][] = [
      [
        {
          text: "FORMA DE PAGO",
          bold: true,
          colSpan: 4,
          fillColor: CRIMSON,
          color: "#FFFFFF",
          fontSize: 9,
          alignment: "center",
          margin: [0, 3, 0, 3],
        } as TableCell,
        {} as TableCell,
        {} as TableCell,
        {} as TableCell,
      ],
      [
        { text: "CONCEPTO", bold: true, fontSize: 8, fillColor: GRAY_HDR },
        { text: "VALOR", bold: true, fontSize: 8, fillColor: GRAY_HDR, alignment: "right" },
        { text: "FECHA", bold: true, fontSize: 8, fillColor: GRAY_HDR, alignment: "center" },
        { text: "", bold: true, fontSize: 8, fillColor: GRAY_HDR },
      ],
    ];

    if (order.anticipo) {
      payRows.push([
        { text: "ANTICIPO", fontSize: 9, fillColor: PINK_BG },
        { text: formatCOP(order.anticipoValor ?? 0), fontSize: 9, alignment: "right", fillColor: PINK_BG },
        { text: order.anticipoFecha ? formatDate(order.anticipoFecha) : "", fontSize: 9, alignment: "center", fillColor: PINK_BG },
        { text: "", fontSize: 9, fillColor: PINK_BG },
      ]);
    }
    if (order.abono2) {
      payRows.push([
        { text: "ABONO 2", fontSize: 9 },
        { text: formatCOP(order.abono2), fontSize: 9, alignment: "right" },
        { text: order.fechaAbono2 ? formatDate(order.fechaAbono2) : "", fontSize: 9, alignment: "center" },
        { text: "", fontSize: 9 },
      ]);
    }
    if (order.credito) {
      payRows.push([
        { text: "CRÉDITO / SALDO", fontSize: 9, fillColor: PINK_BG },
        { text: formatCOP(order.creditoValor ?? order.saldo ?? 0), fontSize: 9, alignment: "right", fillColor: PINK_BG },
        { text: order.fechaPago ? formatDate(order.fechaPago) : "", fontSize: 9, alignment: "center", fillColor: PINK_BG },
        { text: "", fontSize: 9, fillColor: PINK_BG },
      ]);
    }
    if (order.saldo && !order.credito) {
      payRows.push([
        { text: "SALDO", fontSize: 9 },
        { text: formatCOP(order.saldo), fontSize: 9, alignment: "right" },
        { text: order.fechaSaldo ? formatDate(order.fechaSaldo) : "", fontSize: 9, alignment: "center" },
        { text: "", fontSize: 9 },
      ]);
    }

    content.push({
      table: { widths: ["*", 80, 80, 50], body: payRows },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    } as Content);
  }

  // ── 7. Observations ────────────────────────────────────────────────────────────
  if (order.observations || order.notes) {
    content.push({
      stack: [
        { text: "OBSERVACIONES", bold: true, fontSize: 8, color: CRIMSON },
        ...(order.observations ? [{ text: order.observations, fontSize: 9, margin: [0, 2, 0, 0] } as Content] : []),
        ...(order.notes ? [{ text: order.notes, fontSize: 9, margin: [0, 2, 0, 0] } as Content] : []),
      ],
      margin: [0, 0, 0, 10],
    } as Content);
  }

  // ── 8. IMPORTANTE ──────────────────────────────────────────────────────────────
  content.push({
    stack: [
      { text: "IMPORTANTE:", bold: true, fontSize: 8, color: CRIMSON },
      {
        ul: [
          { text: "Una vez leido este formato se debe enviar confirmacion de recibido al correo de origen.", fontSize: 8 },
          { text: "Porfavor enviar certificacion Bancaria para poder realizar el respectivo anticipo y/o pago.", fontSize: 8 },
          { text: "Toda Cuenta de Cobro presentada ante el solicitante debe estar soportada con esta orden de servicio.", fontSize: 8 },
          { text: "El incumplimiento de los anteriores requisitos acarrea devolucion de la Cuenta de Cobro.", fontSize: 8 },
        ],
        margin: [0, 3, 0, 0],
      },
    ],
    margin: [0, 0, 0, 16],
  } as Content);

  // ── 9. Two-column closing ───────────────────────────────────────────────────────
  content.push({
    columns: [
      {
        stack: [
          { image: firmaDataUrl, width: 100, margin: [0, 0, 0, 4] },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: "#888888" }] },
          { text: "JUAN CARLOS LONDOÑO HURTADO", bold: true, fontSize: 9, margin: [0, 4, 0, 1] },
          { text: "CEO & Founder", fontSize: 8, color: "#555555" },
          { text: "TTS GROUP S.A.S", fontSize: 8, color: "#555555" },
        ],
        width: "50%",
      },
      {
        stack: [
          { text: "", margin: [0, 68, 0, 0] },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: "#888888" }] },
          { text: "FIRMA PROVEEDOR", fontSize: 9, color: "#888888", margin: [0, 4, 0, 0] },
        ],
        width: "50%",
      },
    ],
    margin: [0, 0, 0, 0],
  } as Content);

  const docDef: TDocumentDefinitions = {
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#1A1A1A" },
    pageSize: "A4",
    pageMargins: [40, 40, 40, 60],
    footer: pageFooter,
    content,
  };

  return getBuffer(docDef);
}

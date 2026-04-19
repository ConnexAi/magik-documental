import path from "path";
import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import type { MagikEvent, Quote, ServiceOrder, DocumentItem } from "@/lib/types";

// pdfmake 0.3.x exports a configured singleton
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require("pdfmake");

const FONTS = path.join(process.cwd(), "node_modules/pdfmake/build/fonts/Roboto");

pdfmake.fonts = {
  Roboto: {
    normal: path.join(FONTS, "Roboto-Regular.ttf"),
    bold: path.join(FONTS, "Roboto-Medium.ttf"),
    italics: path.join(FONTS, "Roboto-Italic.ttf"),
    bolditalics: path.join(FONTS, "Roboto-MediumItalic.ttf"),
  },
};

function money(n: number): string {
  return `$ ${n.toLocaleString("es-CO")}`;
}

function eventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function today(): string {
  return eventDate(new Date().toISOString().slice(0, 10));
}

// Groups items by rubroName and returns table body rows
function buildItemRows(items: DocumentItem[]): TableCell[][] {
  const groups = new Map<string, DocumentItem[]>();
  for (const item of items) {
    const existing = groups.get(item.rubroName) ?? [];
    existing.push(item);
    groups.set(item.rubroName, existing);
  }

  const rows: TableCell[][] = [];
  for (const [rubroName, groupItems] of Array.from(groups.entries())) {
    // Rubro header row
    rows.push([
      { text: rubroName.toUpperCase(), bold: true, colSpan: 5, fillColor: "#F0F0F0" },
      {}, {}, {}, {},
    ]);
    // Product rows
    for (const item of groupItems) {
      rows.push([
        { text: item.productName },
        { text: item.unit, alignment: "center" },
        { text: String(item.quantity), alignment: "center" },
        { text: money(item.unitPrice), alignment: "right" },
        { text: money(item.total), alignment: "right" },
      ]);
    }
    // Rubro subtotal
    const subtotal = groupItems.reduce((s: number, i: DocumentItem) => s + i.total, 0);
    rows.push([
      { text: `Subtotal ${rubroName}`, bold: true, colSpan: 4, alignment: "right" },
      {}, {}, {},
      { text: money(subtotal), bold: true, alignment: "right" },
    ]);
  }
  return rows;
}

function tableHeader(): TableCell[] {
  return [
    { text: "Descripción", bold: true, fillColor: "#E8E8E8" },
    { text: "Unidad", bold: true, fillColor: "#E8E8E8", alignment: "center" },
    { text: "Cant.", bold: true, fillColor: "#E8E8E8", alignment: "center" },
    { text: "P. Unitario", bold: true, fillColor: "#E8E8E8", alignment: "right" },
    { text: "Total", bold: true, fillColor: "#E8E8E8", alignment: "right" },
  ];
}

function pageFooter(currentPage: number, pageCount: number): Content {
  return {
    text: `Documento generado por MAGIK Producciones  —  Página ${currentPage} de ${pageCount}`,
    alignment: "center",
    fontSize: 8,
    color: "#888888",
    margin: [40, 10, 40, 0],
  };
}

export async function buildQuotePdf(
  quote: Quote,
  event: MagikEvent
): Promise<Buffer> {
  const itemRows = buildItemRows(quote.items);

  const docDef: TDocumentDefinitions = {
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#1A1A1A" },
    pageMargins: [40, 60, 40, 60],
    footer: pageFooter,
    content: [
      // Header
      { text: "MAGIK Producciones", fontSize: 20, bold: true, color: "#D4004E" },
      { text: "COTIZACIÓN", fontSize: 14, bold: true, margin: [0, 4, 0, 12] },

      // Meta info
      {
        columns: [
          {
            stack: [
              { text: [{ text: "Cliente: ", bold: true }, event.clientName] },
              { text: [{ text: "Lugar: ", bold: true }, event.place], margin: [0, 2, 0, 0] },
              { text: [{ text: "Fecha del evento: ", bold: true }, eventDate(event.date)], margin: [0, 2, 0, 0] },
            ],
          },
          {
            stack: [
              { text: [{ text: "Cotización: ", bold: true }, quote.title], alignment: "right" },
              { text: [{ text: "Evento: ", bold: true }, event.consecutive], alignment: "right", margin: [0, 2, 0, 0] },
              { text: [{ text: "Fecha: ", bold: true }, today()], alignment: "right", margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 16],
      },

      // Items table
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [tableHeader(), ...itemRows],
        },
        layout: "lightHorizontalLines",
      },

      // Total
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "TOTAL GENERAL", bold: true, alignment: "right", fontSize: 11 },
              { text: money(quote.total), bold: true, alignment: "right", fontSize: 11 },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 8, 0, 0],
      },

      // Notes
      ...(quote.notes
        ? [{ text: [{ text: "Notas: ", bold: true }, quote.notes], margin: [0, 12, 0, 0], fontSize: 9, color: "#555555" } as Content]
        : []),
    ],
  };

  const doc = pdfmake.createPdf(docDef);
  return doc.getBuffer() as Promise<Buffer>;
}

export async function buildOrderPdf(
  order: ServiceOrder,
  event: MagikEvent
): Promise<Buffer> {
  const itemRows = buildItemRows(order.items);

  const docDef: TDocumentDefinitions = {
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#1A1A1A" },
    pageMargins: [40, 60, 40, 60],
    footer: pageFooter,
    content: [
      // Header
      { text: "MAGIK Producciones", fontSize: 20, bold: true, color: "#D4004E" },
      { text: "ORDEN DE SERVICIO", fontSize: 14, bold: true, margin: [0, 4, 0, 12] },

      // Meta info
      {
        columns: [
          {
            stack: [
              { text: [{ text: "Proveedor: ", bold: true }, order.providerName] },
              { text: [{ text: "Cliente: ", bold: true }, event.clientName], margin: [0, 2, 0, 0] },
              { text: [{ text: "Lugar: ", bold: true }, event.place], margin: [0, 2, 0, 0] },
              { text: [{ text: "Fecha del evento: ", bold: true }, eventDate(event.date)], margin: [0, 2, 0, 0] },
            ],
          },
          {
            stack: [
              { text: [{ text: "Orden: ", bold: true }, order.title], alignment: "right" },
              { text: [{ text: "Evento: ", bold: true }, event.consecutive], alignment: "right", margin: [0, 2, 0, 0] },
              { text: [{ text: "Fecha: ", bold: true }, today()], alignment: "right", margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 0, 0, 16],
      },

      // Items table
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [tableHeader(), ...itemRows],
        },
        layout: "lightHorizontalLines",
      },

      // Total
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: "TOTAL GENERAL", bold: true, alignment: "right", fontSize: 11 },
              { text: money(order.items.reduce((s, i) => s + i.total, 0)), bold: true, alignment: "right", fontSize: 11 },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 8, 0, 0],
      },

      // Notes
      ...(order.notes
        ? [{ text: [{ text: "Notas: ", bold: true }, order.notes], margin: [0, 12, 0, 0], fontSize: 9, color: "#555555" } as Content]
        : []),
    ],
  };

  const doc = pdfmake.createPdf(docDef);
  return doc.getBuffer() as Promise<Buffer>;
}

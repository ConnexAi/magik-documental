import type { DocumentItem } from "@/lib/types";

export const IVA_RATE = 0.19;

export interface QuoteTotals {
  subtotal: number;
  discount: number;
  subtotalWithDiscount: number;
  iva: number;
  total: number;
}

// Cálculo único de totales de cotización: lo usan los diálogos, la API
// (que recalcula y no confía en los totales enviados por el cliente), el PDF
// y el XLSX. El descuento se aplica antes del IVA; el IVA se redondea a pesos.
export function computeQuoteTotals(
  items: Pick<DocumentItem, "quantity" | "unitPrice">[],
  discount: number | undefined,
  hasIva: boolean | undefined
): QuoteTotals {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const safeDiscount = Math.max(0, discount ?? 0);
  const subtotalWithDiscount = subtotal - safeDiscount;
  const iva = hasIva ? Math.round(subtotalWithDiscount * IVA_RATE) : 0;
  return {
    subtotal,
    discount: safeDiscount,
    subtotalWithDiscount,
    iva,
    total: subtotalWithDiscount + iva,
  };
}

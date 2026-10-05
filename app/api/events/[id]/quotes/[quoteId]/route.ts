import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireSession } from "@/lib/session";
import { getQuote, updateQuote, deleteQuote } from "@/lib/firestore";
import { computeQuoteTotals } from "@/lib/quote-totals";
import type { Quote } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getQuote(params.id, params.quoteId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quote: result.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Partial<Quote>;

  // Si cambian ítems, descuento o IVA, recalcular totales con los valores
  // resultantes (los enviados + los ya guardados)
  if (body.items !== undefined || body.discount !== undefined || body.hasIva !== undefined) {
    const current = await getQuote(params.id, params.quoteId);
    if (!current.success) return NextResponse.json({ error: current.error }, { status: 500 });
    if (!current.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const items = (body.items ?? current.data.items).map((i) => ({ ...i, total: i.quantity * i.unitPrice }));
    const { subtotal, total } = computeQuoteTotals(
      items,
      body.discount ?? current.data.discount,
      body.hasIva ?? current.data.hasIva
    );
    body.items = items;
    body.subtotal = subtotal;
    body.total = total;
  }

  const result = await updateQuote(params.id, params.quoteId, body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ quote: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const result = await deleteQuote(params.id, params.quoteId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}

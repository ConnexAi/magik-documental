export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getQuote, getEvent } from "@/lib/firestore";
import { buildQuoteXlsx } from "@/lib/xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;

  const [eventResult, quoteResult] = await Promise.all([
    getEvent(params.id),
    getQuote(params.id, params.quoteId),
  ]);

  if (!eventResult.success || !eventResult.data) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  if (!quoteResult.success || !quoteResult.data) {
    return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });
  }

  const buffer = await buildQuoteXlsx(quoteResult.data, eventResult.data);
  const filename = `cotizacion-${eventResult.data.consecutive}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

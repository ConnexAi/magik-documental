export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getQuote, getEvent } from "@/lib/firestore";

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

  const { buildQuotePdf } = await import("../../../../../../../lib/pdf");
  const buffer = await buildQuotePdf(quoteResult.data, eventResult.data);
  const filename = `cotizacion-${eventResult.data.consecutive}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getQuote, getEvent } from "@/lib/firestore";
import { buildQuoteXlsx } from "@/lib/xlsx";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

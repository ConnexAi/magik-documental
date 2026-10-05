export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getServiceOrder, getEvent } from "@/lib/firestore";
import { buildOrderXlsx } from "@/lib/xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; orderId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;

  const [eventResult, orderResult] = await Promise.all([
    getEvent(params.id),
    getServiceOrder(params.id, params.orderId),
  ]);

  if (!eventResult.success || !eventResult.data) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }
  if (!orderResult.success || !orderResult.data) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const buffer = await buildOrderXlsx(orderResult.data, eventResult.data);
  const filename = `orden-servicio-${eventResult.data.consecutive}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

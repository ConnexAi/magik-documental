export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServiceOrder, getEvent } from "@/lib/firestore";
import { buildOrderXlsx } from "@/lib/xlsx";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; orderId: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

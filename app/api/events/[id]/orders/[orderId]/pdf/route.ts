import { NextRequest, NextResponse } from "next/server";
import { getServiceOrder, getEvent } from "@/lib/firestore";

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

  const { buildOrderPdf } = await import("../../../../../../../lib/pdf");
  const buffer = await buildOrderPdf(orderResult.data, eventResult.data);
  const filename = `orden-servicio-${eventResult.data.consecutive}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

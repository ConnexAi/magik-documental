import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireSession } from "@/lib/session";
import { getServiceOrder, updateServiceOrder, deleteServiceOrder } from "@/lib/firestore";
import type { ServiceOrder } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; orderId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getServiceOrder(params.id, params.orderId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: result.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; orderId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Partial<ServiceOrder>;
  const result = await updateServiceOrder(params.id, params.orderId, body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ order: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; orderId: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const result = await deleteServiceOrder(params.id, params.orderId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}

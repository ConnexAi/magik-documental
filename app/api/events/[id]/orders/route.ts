import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getServiceOrders, createServiceOrder } from "@/lib/firestore";
import type { ServiceOrder } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getServiceOrders(params.id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ orders: result.data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<ServiceOrder, "id" | "orderConsecutive" | "eventId" | "createdBy" | "createdAt" | "updatedAt">;

  const result = await createServiceOrder(params.id, {
    ...body,
    eventId: params.id,
    createdBy: auth.uid,
  });
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ order: result.data }, { status: 201 });
}

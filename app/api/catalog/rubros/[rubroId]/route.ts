import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { updateRubro, deleteRubro } from "@/lib/firestore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rubroId: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as { name: string };
  const result = await updateRubro(params.rubroId, { name: body.name });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { rubroId: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const result = await deleteRubro(params.rubroId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

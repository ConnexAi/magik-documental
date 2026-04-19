import { NextRequest, NextResponse } from "next/server";
import { updateRubro, deleteRubro } from "@/lib/firestore";

function getRole(request: NextRequest) {
  return request.cookies.get("magik_role")?.value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rubroId: string } }
) {
  if (getRole(request) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
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
  if (getRole(request) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await deleteRubro(params.rubroId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

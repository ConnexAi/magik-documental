import { NextRequest, NextResponse } from "next/server";
import { updateEventFile, deleteEventFile } from "@/lib/firestore";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { name?: string; category?: string };
  const result = await updateEventFile(params.id, params.fileId, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ file: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await deleteEventFile(params.id, params.fileId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

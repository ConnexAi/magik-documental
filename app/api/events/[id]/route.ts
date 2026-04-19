import { NextRequest, NextResponse } from "next/server";
import { getEvent, updateEvent, deleteEvent } from "@/lib/firestore";
import type { MagikEvent } from "@/lib/types";

function getRole(request: NextRequest) {
  return request.cookies.get("magik_role")?.value;
}

function requireSession(request: NextRequest): boolean {
  const role = getRole(request);
  return role === "admin" || role === "collaborator";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getEvent(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  if (!result.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ event: result.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Partial<MagikEvent>;
  const result = await updateEvent(params.id, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ event: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (getRole(request) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await deleteEvent(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

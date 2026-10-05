import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireSession } from "@/lib/session";
import { getTemplate, updateTemplate, deleteTemplate } from "@/lib/firestore";
import type { Template } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getTemplate(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  if (!result.data) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ template: result.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Partial<Omit<Template, "id" | "createdAt">>;
  const result = await updateTemplate(params.id, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ template: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const result = await deleteTemplate(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

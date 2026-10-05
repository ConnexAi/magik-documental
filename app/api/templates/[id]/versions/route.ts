import { NextRequest, NextResponse } from "next/server";
import { getUserDisplayName } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/session";
import { getTemplateVersions, publishTemplateVersion } from "@/lib/firestore";
import type { TemplateVersion } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // RF-04 / HU-06: el historial es solo para el admin; el colaborador siempre
  // trabaja con la versión activa (GET /api/templates/[id]).
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getTemplateVersions(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ versions: result.data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<TemplateVersion, "id" | "publishedAt" | "publishedBy" | "publishedByName">;
  const result = await publishTemplateVersion(params.id, {
    ...body,
    templateId: params.id,
    publishedBy: auth.uid,
    publishedByName: await getUserDisplayName(auth.uid),
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ version: result.data }, { status: 201 });
}

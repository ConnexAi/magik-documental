import { NextRequest, NextResponse } from "next/server";
import { verifyTokenSafe } from "@/lib/firebase-admin";
import { getTemplate, updateTemplate, deleteTemplate } from "@/lib/firestore";
import type { Template } from "@/lib/types";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = request.cookies.get("magik_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokenResult = await verifyTokenSafe(token);
  if (!tokenResult.ok) {
    return NextResponse.json(
      { error: tokenResult.expired ? "session_expired" : "Unauthorized" },
      { status: 401 }
    );
  }

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
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await deleteTemplate(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

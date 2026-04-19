import { NextRequest, NextResponse } from "next/server";
import { getCatalog, updateCatalog } from "@/lib/firestore";
import type { CatalogRubro } from "@/lib/types";

function getRole(request: NextRequest) {
  return request.cookies.get("magik_role")?.value;
}

export async function GET(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getCatalog();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ rubros: result.data });
}

export async function PUT(request: NextRequest) {
  if (getRole(request) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as { rubros: CatalogRubro[] };
  const result = await updateCatalog(body.rubros);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

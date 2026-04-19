import { NextRequest, NextResponse } from "next/server";
import { addRubro } from "@/lib/firestore";
import type { CatalogRubro } from "@/lib/types";

function getRole(request: NextRequest) {
  return request.cookies.get("magik_role")?.value;
}

export async function POST(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Omit<CatalogRubro, "id">;
  const result = await addRubro(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ rubro: result.data }, { status: 201 });
}

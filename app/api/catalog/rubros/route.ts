import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { addRubro } from "@/lib/firestore";
import type { CatalogRubro } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<CatalogRubro, "id">;
  const result = await addRubro(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ rubro: result.data }, { status: 201 });
}

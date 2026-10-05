import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { addProduct } from "@/lib/firestore";
import type { CatalogProduct } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { rubroId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<CatalogProduct, "id">;
  const result = await addProduct(params.rubroId, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ product: result.data }, { status: 201 });
}

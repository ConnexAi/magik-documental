import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { updateProduct, deleteProduct } from "@/lib/firestore";
import type { CatalogProduct } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rubroId: string; productId: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Partial<Omit<CatalogProduct, "id">>;
  const result = await updateProduct(params.rubroId, params.productId, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { rubroId: string; productId: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const result = await deleteProduct(params.rubroId, params.productId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

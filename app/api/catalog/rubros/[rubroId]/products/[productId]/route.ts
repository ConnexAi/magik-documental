import { NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/lib/firestore";
import type { CatalogProduct } from "@/lib/types";

function getRole(request: NextRequest) {
  return request.cookies.get("magik_role")?.value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rubroId: string; productId: string } }
) {
  if (getRole(request) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
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
  if (getRole(request) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await deleteProduct(params.rubroId, params.productId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

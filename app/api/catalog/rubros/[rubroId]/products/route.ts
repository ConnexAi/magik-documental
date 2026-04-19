import { NextRequest, NextResponse } from "next/server";
import { addProduct } from "@/lib/firestore";
import type { CatalogProduct } from "@/lib/types";

function getRole(request: NextRequest) {
  return request.cookies.get("magik_role")?.value;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { rubroId: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Omit<CatalogProduct, "id">;
  const result = await addProduct(params.rubroId, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ product: result.data }, { status: 201 });
}

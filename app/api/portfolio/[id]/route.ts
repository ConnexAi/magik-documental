import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { updatePortfolioItem, deletePortfolioItem } from "@/lib/firestore";
import type { PortfolioItem } from "@/lib/types";

const MAX_PHOTOS = 5;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as Partial<Omit<PortfolioItem, "id" | "publishedAt">>;
  if (body.imageUrls && body.imageUrls.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Máximo ${MAX_PHOTOS} fotos por evento` }, { status: 400 });
  }
  const result = await updatePortfolioItem(params.id, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ item: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const result = await deletePortfolioItem(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

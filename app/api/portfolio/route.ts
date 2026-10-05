import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireSession } from "@/lib/session";
import {
  getPortfolioItems,
  getAllPortfolioItems,
  createPortfolioItem,
} from "@/lib/firestore";
import type { PortfolioItem } from "@/lib/types";

const MAX_PHOTOS = 5;

// GET es público: sin sesión válida solo devuelve los items visibles.
// Con un token verificado devuelve todos (panel admin del portafolio).
export async function GET(request: NextRequest) {
  const hasSession = request.cookies.has("magik_token")
    ? !((await requireSession(request)) instanceof NextResponse)
    : false;
  const result = hasSession ? await getAllPortfolioItems() : await getPortfolioItems();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ items: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<PortfolioItem, "id" | "publishedAt">;
  if (body.imageUrls && body.imageUrls.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Máximo ${MAX_PHOTOS} fotos por evento` }, { status: 400 });
  }
  const result = await createPortfolioItem(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ item: result.data }, { status: 201 });
}

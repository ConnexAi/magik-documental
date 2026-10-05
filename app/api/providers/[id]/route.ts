import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { updateProvider, deleteProvider } from "@/lib/firestore";
import type { Provider } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Partial<Omit<Provider, "id" | "createdAt">>;
  const result = await updateProvider(params.id, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ provider: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const result = await deleteProvider(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

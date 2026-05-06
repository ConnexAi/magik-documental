import { NextRequest, NextResponse } from "next/server";
import { updateProvider, deleteProvider } from "@/lib/firestore";
import type { Provider } from "@/lib/types";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await deleteProvider(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

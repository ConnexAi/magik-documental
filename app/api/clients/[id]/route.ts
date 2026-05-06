import { NextRequest, NextResponse } from "next/server";
import { getClientWithHistory, updateClient, deleteClient } from "@/lib/firestore";
import type { Client } from "@/lib/types";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getClientWithHistory(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result.data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Partial<Omit<Client, "id" | "createdAt">>;
  const result = await updateClient(params.id, body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ client: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await deleteClient(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

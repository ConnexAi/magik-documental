import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getClients, createClient } from "@/lib/firestore";
import type { Client } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getClients();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ clients: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<Client, "id" | "createdAt" | "updatedAt">;
  const result = await createClient({ ...body, eventIds: body.eventIds ?? [] });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ client: result.data }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getProviders, createProvider } from "@/lib/firestore";
import type { Provider } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getProviders();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ providers: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<Provider, "id" | "createdAt" | "updatedAt">;
  const result = await createProvider(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ provider: result.data }, { status: 201 });
}

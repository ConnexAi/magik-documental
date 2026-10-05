import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getQuotes, createQuote } from "@/lib/firestore";
import type { Quote } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getQuotes(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ quotes: result.data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<Quote, "id" | "consecutive" | "eventId" | "version" | "status" | "createdBy" | "createdAt" | "updatedAt">;

  const result = await createQuote(params.id, {
    ...body,
    eventId: params.id,
    version: 1,
    status: "draft",
    createdBy: auth.uid,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ quote: result.data }, { status: 201 });
}

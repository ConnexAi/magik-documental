import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { duplicateQuote } from "@/lib/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await duplicateQuote(params.id, params.quoteId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ quote: result.data }, { status: 201 });
}

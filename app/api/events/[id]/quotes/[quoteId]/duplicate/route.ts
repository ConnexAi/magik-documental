import { NextRequest, NextResponse } from "next/server";
import { duplicateQuote } from "@/lib/firestore";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await duplicateQuote(params.id, params.quoteId);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ quote: result.data }, { status: 201 });
}

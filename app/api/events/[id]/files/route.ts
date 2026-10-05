import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getUserDisplayName } from "@/lib/firebase-admin";
import { getEventFiles, createEventFile } from "@/lib/firestore";
import type { EventFile } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const category = request.nextUrl.searchParams.get("category") ?? undefined;
  const result = await getEventFiles(params.id, category);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ files: result.data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<EventFile, "id" | "eventId" | "uploadedBy" | "uploadedByName" | "createdAt">;
  const result = await createEventFile(params.id, {
    ...body,
    eventId: params.id,
    uploadedBy: auth.uid,
    uploadedByName: await getUserDisplayName(auth.uid),
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ file: result.data }, { status: 201 });
}

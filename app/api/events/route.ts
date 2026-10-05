import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getEvents, createEvent, addEventToClient } from "@/lib/firestore";
import type { EventFilters } from "@/lib/firestore";
import type { MagikEvent } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const filters: EventFilters = {};
  const clientName = searchParams.get("clientName");
  const year = searchParams.get("year");
  const eventType = searchParams.get("eventType") as MagikEvent["eventType"] | null;
  const place = searchParams.get("place");

  if (clientName) filters.clientName = clientName;
  if (year) filters.year = parseInt(year);
  if (eventType) filters.eventType = eventType;
  if (place) filters.place = place;

  const result = await getEvents(filters);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ events: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<
    MagikEvent,
    "id" | "consecutive" | "createdBy" | "createdAt" | "updatedAt"
  > & { clientId?: string };

  const { clientId, ...eventData } = body;
  const missing = (["clientName", "eventType", "place", "date"] as const).filter(
    (k) => typeof eventData[k] !== "string" || eventData[k].trim() === ""
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Campos obligatorios: ${missing.join(", ")}` },
      { status: 400 }
    );
  }
  const result = await createEvent({ ...eventData, createdBy: auth.uid });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  if (clientId && result.data) {
    await addEventToClient(clientId, result.data.id);
  }
  return NextResponse.json({ event: result.data }, { status: 201 });
}

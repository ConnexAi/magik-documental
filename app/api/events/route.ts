import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getEvents, createEvent } from "@/lib/firestore";
import type { EventFilters } from "@/lib/firestore";
import type { MagikEvent } from "@/lib/types";

function requireSession(request: NextRequest): boolean {
  const role = request.cookies.get("magik_role")?.value;
  return role === "admin" || role === "collaborator";
}

export async function GET(request: NextRequest) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = request.cookies.get("magik_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const body = (await request.json()) as Omit<
    MagikEvent,
    "id" | "consecutive" | "createdBy" | "createdAt" | "updatedAt"
  >;

  const result = await createEvent({ ...body, createdBy: decoded.uid });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ event: result.data }, { status: 201 });
}

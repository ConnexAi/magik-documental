import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { setUserRole } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/types";

export async function POST(request: NextRequest) {
  const callerRole = request.cookies.get("magik_role")?.value;
  if (callerRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid, role } = (await request.json()) as { uid: string; role: UserRole };

  await setUserRole(uid, role);

  await adminDb.collection("users").doc(uid).update({
    role,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

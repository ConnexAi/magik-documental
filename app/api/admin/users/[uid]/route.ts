import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { setUserRole } from "@/lib/firebase-admin";
import { updateUser, deleteUser } from "@/lib/firestore";
import type { UserRole } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const callerRole = request.cookies.get("magik_role")?.value;
  if (callerRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = params;
  const body = (await request.json()) as { role?: UserRole; active?: boolean };

  if (body.role !== undefined) {
    await setUserRole(uid, body.role);
  }

  const result = await updateUser(uid, {
    ...(body.role !== undefined && { role: body.role }),
    ...(body.active !== undefined && { active: body.active }),
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const callerRole = request.cookies.get("magik_role")?.value;
  if (callerRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = params;

  // Prevent self-deletion
  const token = request.cookies.get("magik_token")?.value;
  if (token) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.uid === uid) {
        return NextResponse.json(
          { error: "No puedes eliminar tu propia cuenta" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  }

  await adminAuth.deleteUser(uid);

  const result = await deleteUser(uid);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

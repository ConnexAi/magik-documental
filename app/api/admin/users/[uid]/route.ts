import { NextRequest, NextResponse } from "next/server";
import { adminAuth, setUserRole } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/session";
import { updateUser, deleteUser } from "@/lib/firestore";
import type { UserRole } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { uid } = params;
  const body = (await request.json()) as { role?: UserRole; active?: boolean };

  if (body.role !== undefined) {
    await setUserRole(uid, body.role);
  }

  // Desactivar bloquea el acceso en Firebase Auth (no puede iniciar sesión ni
  // renovar el token); activar lo vuelve a habilitar.
  if (body.active !== undefined) {
    await adminAuth.updateUser(uid, { disabled: !body.active });
    if (!body.active) await adminAuth.revokeRefreshTokens(uid);
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
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { uid } = params;

  // Prevent self-deletion
  if (auth.uid === uid) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta" },
      { status: 400 }
    );
  }

  await adminAuth.deleteUser(uid);

  const result = await deleteUser(uid);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

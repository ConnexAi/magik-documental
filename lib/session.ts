import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyTokenSafe } from "@/lib/firebase-admin";

// Autorización del servidor: SIEMPRE a partir de magik_token verificado con
// firebase-admin. La cookie magik_role existe solo para la UI del cliente y
// nunca se usa para autorizar.

export interface SessionInfo {
  uid: string;
  role: string;
}

const TOKEN_COOKIE = "magik_token";

export async function requireSession(
  request: NextRequest
): Promise<SessionInfo | NextResponse> {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const tokenResult = await verifyTokenSafe(token);
  if (!tokenResult.ok) {
    return NextResponse.json(
      { error: tokenResult.expired ? "session_expired" : "invalid_session" },
      { status: 401 }
    );
  }

  const { uid } = tokenResult.decoded;
  let role = typeof tokenResult.decoded.role === "string" ? tokenResult.decoded.role : undefined;

  if (!role) {
    try {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const docRole = userDoc.exists ? (userDoc.data() as { role?: unknown }).role : undefined;
      if (typeof docRole === "string") role = docRole;
    } catch {
      return NextResponse.json({ error: "invalid_session" }, { status: 401 });
    }
  }

  if (!role) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  return { uid, role };
}

export async function requireAdmin(
  request: NextRequest
): Promise<SessionInfo | NextResponse> {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return auth;
}

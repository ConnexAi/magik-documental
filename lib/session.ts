import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

// ── Páginas (Server Components) ─────────────────────────────────────────────
// El middleware solo revisa que existan cookies. Las páginas que leen datos
// de Firestore deben verificar el token igual que las API Routes. Usar
// cookies() además obliga a Next a renderizarlas en cada request (sin esto
// se prerenderizan en el build con los datos de ese momento).

async function pageSession(): Promise<SessionInfo | null> {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const tokenResult = await verifyTokenSafe(token);
  // Token vencido o inválido: el login limpia las cookies y, si Firebase aún
  // tiene la sesión en el navegador, la renueva sin pedir la contraseña.
  if (!tokenResult.ok) redirect("/login?session=expired");
  const { uid } = tokenResult.decoded;
  let role = typeof tokenResult.decoded.role === "string" ? tokenResult.decoded.role : undefined;
  if (!role) {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const docRole = userDoc.exists ? (userDoc.data() as { role?: unknown }).role : undefined;
    if (typeof docRole === "string") role = docRole;
  }
  return role ? { uid, role } : null;
}

export async function requirePageSession(): Promise<SessionInfo> {
  const session = await pageSession();
  if (!session) redirect("/login");
  return session;
}

export async function requirePageAdmin(): Promise<SessionInfo> {
  const session = await requirePageSession();
  if (session.role !== "admin") redirect("/dashboard/events");
  return session;
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/types";

// Secure en producción. Solo el build de pruebas contra el emulador
// (tests/README.md) sirve por http://localhost, donde Safari/WebKit rechaza
// cookies Secure; esa variable no existe en el deploy real.
const SECURE_COOKIES =
  process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "true";

const TOKEN_OPTS = {
  httpOnly: true,
  secure: SECURE_COOKIES,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

// magik_role no es httpOnly — el cliente la lee para filtrar el sidebar
const ROLE_OPTS = {
  httpOnly: false,
  secure: SECURE_COOKIES,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

export async function POST(request: NextRequest) {
  try {
    const { idToken } = (await request.json()) as { idToken: string };

    const decoded = await adminAuth.verifyIdToken(idToken);

    let role = decoded.role as UserRole | undefined;

    if (!role) {
      const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
      if (userDoc.exists) {
        role = (userDoc.data() as { role?: UserRole }).role;
      }
    }

    if (!role) {
      return NextResponse.json({ error: "User has no role assigned" }, { status: 403 });
    }

    const response = NextResponse.json({ role });
    response.cookies.set("magik_token", idToken, TOKEN_OPTS);
    response.cookies.set("magik_role", role, ROLE_OPTS);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/types";

const TOKEN_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

// magik_role no es httpOnly — el cliente la lee para filtrar el sidebar
const ROLE_OPTS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
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

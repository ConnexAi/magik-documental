import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/types";

const ROLE_COOKIE = "magik_role";
const TOKEN_COOKIE = "magik_token";

function getHomeForRole(_role: UserRole): string {
  return "/dashboard/events";
}

// Este middleware SOLO redirige la navegación del cliente (login, dashboard,
// portal) a partir de las cookies presentes. No es una barrera de seguridad:
// magik_role puede editarse desde DevTools. La autorización real ocurre en
// cada API Route, que verifica magik_token con firebase-admin mediante
// requireSession / requireAdmin de lib/session.ts.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value as UserRole | undefined;
  const hasSession = Boolean(token && role);

  // ── / root ────────────────────────────────────────────────────────────────
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // ── /login ────────────────────────────────────────────────────────────────
  if (pathname === "/login") {
    if (hasSession && role) {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }
    return NextResponse.next();
  }

  // ── /portal — público, sin autenticación ──────────────────────────────────
  if (pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  // ── /dashboard/admin/* — solo admin ──────────────────────────────────────
  if (pathname.startsWith("/dashboard/admin")) {
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    if (role === "collaborator") {
      return NextResponse.redirect(new URL("/dashboard/events", request.url));
    }
    return NextResponse.next();
  }

  // ── /dashboard/* — requiere sesión ───────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

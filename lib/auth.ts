"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { UserRole } from "@/lib/types";

export function getCurrentUserRole(): UserRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)magik_role=([^;]+)/);
  return match ? (match[1] as UserRole) : null;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  await signOut(auth);
}

export async function refreshToken(): Promise<void> {
  const newToken = await auth.currentUser?.getIdToken(true);
  if (!newToken) return;
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: newToken }),
  });
}

export async function fetchWithAuth(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    if (body.error === "session_expired") {
      await refreshToken();
      return fetch(url, options);
    }
  }
  return res;
}

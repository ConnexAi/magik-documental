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

"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Firebase renueva el ID token antes de que expire (cada hora) mientras la app
// está abierta. Cada renovación se envía a /api/auth/session para mantener la
// cookie magik_token vigente; las páginas del dashboard la verifican en el servidor.
export function useSessionSync(): void {
  useEffect(() => {
    let last: string | null = null;
    return onIdTokenChanged(auth, async (user) => {
      if (!user) return;
      const idToken = await user.getIdToken();
      if (idToken === last) return;
      last = idToken;
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }).catch(() => {});
    });
  }, []);
}

"use client";

import { useEffect, useState } from "react";
import { getCurrentUserRole } from "@/lib/auth";

// Solo para mostrar u ocultar controles en la UI. La autorización real la
// hacen las API Routes con requireSession / requireAdmin (lib/session.ts).
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(getCurrentUserRole() === "admin");
  }, []);
  return isAdmin;
}

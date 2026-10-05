// IMPORTANTE: Configurar reglas de Storage en Firebase Console:
// Storage > Rules > Pegar estas reglas:
// rules_version = '2';
// service firebase.storage {
//   match /b/{bucket}/o {
//     match /templates/{allPaths=**} {
//       allow read: if request.auth != null;
//       allow write: if request.auth != null;
//     }
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireSession } from "@/lib/session";
import { getTemplates, createTemplate } from "@/lib/firestore";
import type { Template } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth instanceof NextResponse) return auth;
  const result = await getTemplates();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ templates: result.data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as Omit<Template, "id" | "createdAt" | "updatedAt">;
  const result = await createTemplate(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ template: result.data }, { status: 201 });
}

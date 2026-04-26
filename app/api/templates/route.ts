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
import { verifyTokenSafe } from "@/lib/firebase-admin";
import { getTemplates, createTemplate } from "@/lib/firestore";
import type { Template } from "@/lib/types";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function GET(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getTemplates();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ templates: result.data });
}

export async function POST(request: NextRequest) {
  const role = getRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = request.cookies.get("magik_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokenResult = await verifyTokenSafe(token);
  if (!tokenResult.ok) {
    return NextResponse.json(
      { error: tokenResult.expired ? "session_expired" : "Unauthorized" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as Omit<Template, "id" | "createdAt" | "updatedAt">;
  const result = await createTemplate(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ template: result.data }, { status: 201 });
}

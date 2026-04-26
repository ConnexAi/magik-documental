import { NextRequest, NextResponse } from "next/server";
import { verifyTokenSafe } from "@/lib/firebase-admin";
import { getTemplateVersions, publishTemplateVersion } from "@/lib/firestore";
import type { TemplateVersion } from "@/lib/types";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = getRole(request);
  if (role !== "admin" && role !== "collaborator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await getTemplateVersions(params.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ versions: result.data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const body = (await request.json()) as Omit<TemplateVersion, "id" | "publishedAt" | "publishedBy">;
  const result = await publishTemplateVersion(params.id, {
    ...body,
    templateId: params.id,
    publishedBy: tokenResult.decoded.uid,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ version: result.data }, { status: 201 });
}

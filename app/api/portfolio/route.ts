import { NextRequest, NextResponse } from "next/server";
import { verifyTokenSafe } from "@/lib/firebase-admin";
import {
  getPortfolioItems,
  getAllPortfolioItems,
  createPortfolioItem,
} from "@/lib/firestore";
import type { PortfolioItem } from "@/lib/types";

function getRole(r: NextRequest) {
  return r.cookies.get("magik_role")?.value;
}

export async function GET(request: NextRequest) {
  const role = getRole(request);
  const result =
    role === "admin" || role === "collaborator"
      ? await getAllPortfolioItems()
      : await getPortfolioItems();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ items: result.data });
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

  const body = (await request.json()) as Omit<PortfolioItem, "id" | "publishedAt">;
  const result = await createPortfolioItem(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ item: result.data }, { status: 201 });
}

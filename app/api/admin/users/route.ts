import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { setUserRole } from "@/lib/firebase-admin";
import { createUser, getUsers } from "@/lib/firestore";
import type { UserRole } from "@/lib/types";

export async function GET(request: NextRequest) {
  const callerRole = request.cookies.get("magik_role")?.value;
  if (callerRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await getUsers();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ users: result.data });
}

export async function POST(request: NextRequest) {
  const callerRole = request.cookies.get("magik_role")?.value;
  if (callerRole !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, password, displayName, role } = (await request.json()) as {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  };

  const authUser = await adminAuth.createUser({ email, password, displayName });
  await setUserRole(authUser.uid, role);

  const now = new Date().toISOString();
  const newUser = {
    uid: authUser.uid,
    email,
    displayName,
    role,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await createUser(newUser);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ user: newUser }, { status: 201 });
}

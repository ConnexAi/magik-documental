import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { UserRole } from "@/lib/types";

export type TokenResult =
  | { ok: true; decoded: DecodedIdToken }
  | { ok: false; expired: boolean };

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export async function verifySessionToken(idToken: string): Promise<DecodedIdToken> {
  return adminAuth.verifyIdToken(idToken);
}

export async function verifyTokenSafe(token: string): Promise<TokenResult> {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { ok: true, decoded };
  } catch (err: unknown) {
    const code = (err as { errorInfo?: { code?: string } }).errorInfo?.code;
    return { ok: false, expired: code === "auth/id-token-expired" };
  }
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { role });
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const user = await adminAuth.getUser(uid);
  return (user.customClaims?.role as UserRole) ?? null;
}

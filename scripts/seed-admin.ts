import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const requiredEnv = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  const now = new Date().toISOString();

  // Create or fetch user
  let uid: string;
  try {
    const existing = await adminAuth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`User already exists: ${uid}`);
  } catch {
    const newUser = await adminAuth.createUser({
      email,
      password,
      displayName: "Administrador MAGIK",
      emailVerified: true,
    });
    uid = newUser.uid;
    console.log(`User created: ${uid}`);
  }

  // Set custom claim
  await adminAuth.setCustomUserClaims(uid, { role: "admin" });
  console.log(`Custom claim { role: "admin" } set for uid: ${uid}`);

  // Write Firestore document
  await adminDb.collection("users").doc(uid).set({
    uid,
    email,
    displayName: "Administrador MAGIK",
    role: "admin",
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Firestore document created in users/${uid}`);

  console.log(`\n✓ Admin seeded successfully — UID: ${uid}`);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

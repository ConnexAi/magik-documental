import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { PROJECT_ID, applyEmulatorEnv } from "./env";

// App de firebase-admin para el proceso de pruebas (semilla y verificaciones
// directas en Firestore). Siempre contra el emulador, sin credenciales.
function testApp(): App {
  applyEmulatorEnv();
  const existing = getApps().find((a) => a.name === "magik-tests");
  return existing ?? initializeApp({ projectId: PROJECT_ID }, "magik-tests");
}

export function testDb() {
  return getFirestore(testApp());
}

export function testAuth() {
  return getAuth(testApp());
}

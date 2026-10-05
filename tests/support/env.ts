// Configuración única del entorno de pruebas. Todo apunta al Firebase
// Emulator local con el proyecto "demo-magik": un project ID con prefijo
// "demo-" hace que el emulador nunca contacte recursos reales de Google.

export const PROJECT_ID = "demo-magik";
export const API_KEY = "demo-api-key";

export const EMULATOR = {
  auth: "127.0.0.1:9099",
  firestore: "127.0.0.1:8080",
  storage: "127.0.0.1:9199",
} as const;

export const TEST_PORT = 3100;
// localhost (no 127.0.0.1): Chrome acepta cookies Secure en localhost, y el
// build de producción marca magik_token como Secure.
export const BASE_URL = `http://localhost:${TEST_PORT}`;
export const TEST_DIST_DIR = ".next-test";

export const USERS = {
  admin: { email: "test-admin@magikenter.com", password: "Test1234!", displayName: "Admin Pruebas", role: "admin" },
  collaborator: { email: "test-colab@magikenter.com", password: "Test1234!", displayName: "Colaborador Pruebas", role: "collaborator" },
} as const;

// Variables para cualquier proceso que use firebase-admin (seed, pruebas,
// servidor Next). Con *_EMULATOR_HOST el Admin SDK habla solo con el emulador.
export function emulatorEnv(): Record<string, string> {
  return {
    FIRESTORE_EMULATOR_HOST: EMULATOR.firestore,
    FIREBASE_AUTH_EMULATOR_HOST: EMULATOR.auth,
    FIREBASE_STORAGE_EMULATOR_HOST: EMULATOR.storage,
    GCLOUD_PROJECT: PROJECT_ID,
  };
}

export function applyEmulatorEnv(): void {
  Object.assign(process.env, emulatorEnv());
  assertEmulatorOnly();
}

// Barrera de seguridad: aborta si algo no apunta al emulador demo.
export function assertEmulatorOnly(env: NodeJS.ProcessEnv = process.env): void {
  const problems: string[] = [];
  if (env.FIRESTORE_EMULATOR_HOST !== EMULATOR.firestore) problems.push("FIRESTORE_EMULATOR_HOST");
  if (env.FIREBASE_AUTH_EMULATOR_HOST !== EMULATOR.auth) problems.push("FIREBASE_AUTH_EMULATOR_HOST");
  if (env.GCLOUD_PROJECT !== PROJECT_ID) problems.push("GCLOUD_PROJECT");
  if (problems.length > 0) {
    throw new Error(
      `Entorno de pruebas inseguro, no apunta al emulador demo: ${problems.join(", ")}. ` +
        "Las pruebas nunca deben tocar el proyecto de producción."
    );
  }
}

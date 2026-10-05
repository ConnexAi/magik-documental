import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { BASE_URL, PROJECT_ID, TEST_DIST_DIR, TEST_PORT, API_KEY, emulatorEnv, assertEmulatorOnly } from "./env";

// Entorno del servidor Next de pruebas. Sobrescribe TODAS las variables de
// .env.local (Next da prioridad a process.env sobre los archivos .env), así
// que el servidor nunca recibe las credenciales reales de producción.
export function testServerEnv(): NodeJS.ProcessEnv {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...emulatorEnv(),
    NEXT_DIST_DIR: TEST_DIST_DIR,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
    NEXT_PUBLIC_FIREBASE_API_KEY: API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${PROJECT_ID}.firebaseapp.com`,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: `${PROJECT_ID}.appspot.com`,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:demo",
    FIREBASE_ADMIN_PROJECT_ID: PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: `test@${PROJECT_ID}.iam.gserviceaccount.com`,
    // Llave desechable generada en cada arranque; el emulador no la valida
    FIREBASE_ADMIN_PRIVATE_KEY: privateKey,
    ADMIN_EMAIL: "",
    ADMIN_PASSWORD: "",
  };
  assertEmulatorOnly(env);
  return env;
}

export function buildTestServer(env: NodeJS.ProcessEnv): void {
  const res = spawnSync("npx", ["next", "build"], { env, stdio: "inherit" });
  if (res.status !== 0) throw new Error("next build (pruebas) falló");
}

export async function waitForServer(timeoutMs = 120_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/portfolio`, { signal: AbortSignal.timeout(3000) });
      if (res.status < 500) return;
    } catch {
      // aún no responde
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`El servidor de pruebas no respondió en ${BASE_URL}`);
}

export async function startTestServer(): Promise<ChildProcess> {
  const env = testServerEnv();
  if (process.env.TEST_SKIP_BUILD !== "1") buildTestServer(env);
  const child = spawn("npx", ["next", "start", "-p", String(TEST_PORT)], {
    env,
    stdio: ["ignore", "inherit", "inherit"],
    detached: true,
  });
  await waitForServer();
  return child;
}

export function stopTestServer(child: ChildProcess | undefined): void {
  if (!child?.pid) return;
  try {
    // detached: matar el grupo completo (npx + next)
    process.kill(-child.pid, "SIGTERM");
  } catch {
    // ya terminó
  }
}

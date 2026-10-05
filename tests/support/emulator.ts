import { EMULATOR, PROJECT_ID } from "./env";

async function reachable(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

export async function assertEmulatorsRunning(): Promise<void> {
  const checks = await Promise.all([
    reachable(`http://${EMULATOR.auth}/`),
    reachable(`http://${EMULATOR.firestore}/`),
    reachable(`http://${EMULATOR.storage}/`),
  ]);
  if (checks.includes(false)) {
    throw new Error(
      "El Firebase Emulator no está corriendo (auth 9099, firestore 8080, storage 9199). " +
        "Inícialo con: npm run test:emulators"
    );
  }
}

// Borra todos los documentos y cuentas del proyecto demo en el emulador.
export async function clearEmulators(): Promise<void> {
  const fs = await fetch(
    `http://${EMULATOR.firestore}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  const auth = await fetch(
    `http://${EMULATOR.auth}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: "DELETE" }
  );
  if (!fs.ok || !auth.ok) {
    throw new Error(`No se pudo limpiar el emulador (firestore ${fs.status}, auth ${auth.status})`);
  }
}

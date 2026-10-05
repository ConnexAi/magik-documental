import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// El navegador solo usa Firebase Auth y Storage. Firestore se accede
// exclusivamente desde el servidor a través de lib/firestore.ts con el Admin SDK.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Solo en el build de pruebas (tests/README.md): conecta al Firebase Emulator
// local. En producción esta variable no existe y no se ejecuta.
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && typeof window !== "undefined") {
  const w = window as Window & { __magikEmulatorConnected?: boolean };
  if (!w.__magikEmulatorConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    w.__magikEmulatorConnected = true;
  }
}

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = admin.apps.length
  ? admin.apps[0]!
  : admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

const db = admin.firestore(app);

const TEMPLATES = [
  {
    name: "Cotización Estándar MAGIK",
    type: "quote",
    activeVersion: 1,
    storageUrl: "",
  },
  {
    name: "Orden de Servicio Técnico",
    type: "serviceOrder",
    activeVersion: 1,
    storageUrl: "",
  },
  {
    name: "Cotización Evento Corporativo",
    type: "quote",
    activeVersion: 1,
    storageUrl: "",
  },
] as const;

async function seed() {
  const now = new Date().toISOString();
  for (const t of TEMPLATES) {
    const ref = db.collection("templates").doc();
    const template = { ...t, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(template);

    // Create first version entry
    const vRef = db.collection("templates").doc(ref.id).collection("versions").doc();
    await vRef.set({
      id: vRef.id,
      templateId: ref.id,
      version: 1,
      storageUrl: "",
      changelog: "Versión inicial",
      publishedBy: "seed",
      publishedAt: now,
    });

    console.log(`Created template: ${t.name} (${ref.id})`);
  }
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

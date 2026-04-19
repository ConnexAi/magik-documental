import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

const app = admin.apps.length
  ? admin.apps[0]!
  : admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
      }),
    });

const db = admin.firestore(app);

function p(
  name: string,
  unit: string,
  defaultPrice: number
): { id: string; name: string; unit: string; defaultPrice: number } {
  return { id: randomUUID(), name, unit, defaultPrice };
}

const rubros = [
  {
    id: randomUUID(),
    name: "Audio",
    products: [
      p('Cabina JBL 15"', "und", 150000),
      p("Consola Allen Heath", "dia", 200000),
      p("Micrófono inalámbrico", "und", 50000),
    ],
  },
  {
    id: randomUUID(),
    name: "Iluminación",
    products: [
      p("Par LED 54x3w", "und", 35000),
      p("Moving head Beam", "und", 120000),
      p("Controlador DMX", "dia", 80000),
    ],
  },
  {
    id: randomUUID(),
    name: "Tarimas",
    products: [
      p("Módulo tarima 1x1m", "und", 45000),
      p("Escalera acceso", "und", 25000),
    ],
  },
  {
    id: randomUUID(),
    name: "Carpas",
    products: [
      p("Carpa 6x6m", "und", 350000),
      p("Carpa 3x3m", "und", 150000),
    ],
  },
  {
    id: randomUUID(),
    name: "Mobiliario",
    products: [
      p("Mesa redonda", "und", 25000),
      p("Silla Tiffany", "und", 8000),
      p("Mantel", "und", 5000),
    ],
  },
  {
    id: randomUUID(),
    name: "Video",
    products: [
      p("Pantalla 50 pulgadas", "dia", 180000),
      p("Proyector 5000 lúmenes", "dia", 250000),
    ],
  },
  {
    id: randomUUID(),
    name: "Pantallas LED",
    products: [
      p("Módulo LED P3.9 interior", "m2", 450000),
      p("Módulo LED P4.8 exterior", "m2", 550000),
    ],
  },
];

async function main() {
  await db.collection("catalog").doc("rubros").set({ items: rubros });
  console.log(`Catálogo creado: ${rubros.length} rubros`);
  rubros.forEach((r) =>
    console.log(`  ${r.name}: ${r.products.length} productos`)
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

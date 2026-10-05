// Prueba de carga (RNF-05): 10 usuarios concurrentes durante 30 s contra
// GET /api/events y la búsqueda, con 500 eventos semilla en el emulador.
// Ejecutar con el emulador encendido: npm run test:load
import { mkdirSync, writeFileSync } from "node:fs";
import autocannon from "autocannon";
import { applyEmulatorEnv, BASE_URL } from "../support/env";
import { seed } from "../emulator/seed";
import { testDb } from "../support/admin";
import { sessionCookie } from "../support/auth";
import { startTestServer, stopTestServer } from "../support/server";

const OUT = "evidencias/pruebas/load";
const EVENTS = 500;
const CONNECTIONS = 10;
const DURATION_S = 30;
// Umbrales: sin errores y p99 por debajo de 1 s (criterio de HU-10 / RNF-03)
const MAX_P99_MS = 1000;

const CLIENTS = ["Bancolombia", "Carvajal", "Univalle", "Colombina", "Tecnoquímicas"];
const TYPES = ["corporativo", "entretenimiento", "especial"];
const PLACES = ["Cali", "Palmira", "Jamundí", "Yumbo", "Buenaventura"];

async function seedManyEvents(): Promise<void> {
  const db = testDb();
  for (let start = 0; start < EVENTS; start += 400) {
    const batch = db.batch();
    for (let i = start; i < Math.min(start + 400, EVENTS); i++) {
      const id = `load-${String(i).padStart(4, "0")}`;
      const n = i + 4; // EVT-0001..0003 vienen de la semilla base
      batch.set(db.collection("events").doc(id), {
        id, consecutive: `EVT-${String(n).padStart(4, "0")}`, eventName: `Evento carga ${i}`,
        clientName: CLIENTS[i % CLIENTS.length], eventType: TYPES[i % TYPES.length],
        place: `${PLACES[i % PLACES.length]}, Valle`, date: `${2024 + (i % 3)}-${String((i % 12) + 1).padStart(2, "0")}-15`,
        createdBy: "load", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
      });
    }
    await batch.commit();
  }
  await db.collection("counters").doc("events").set({ count: EVENTS + 3 });
}

interface Summary {
  endpoint: string;
  requests: number;
  rps: number;
  errors: number;
  non2xx: number;
  latency: { p50: number; p90: number; p99: number; max: number; mean: number };
  ok: boolean;
}

async function run(name: string, path: string, cookie: string): Promise<Summary> {
  const result = await autocannon({
    url: `${BASE_URL}${path}`,
    connections: CONNECTIONS,
    duration: DURATION_S,
    headers: { cookie },
  });
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify(result, null, 2));
  const summary: Summary = {
    endpoint: `GET ${path}`,
    requests: result.requests.total,
    rps: Math.round(result.requests.average),
    errors: result.errors + result.timeouts,
    non2xx: result.non2xx,
    latency: {
      p50: result.latency.p50, p90: result.latency.p90, p99: result.latency.p99,
      max: result.latency.max, mean: Math.round(result.latency.average),
    },
    ok: false,
  };
  summary.ok = summary.errors === 0 && summary.non2xx === 0 && summary.latency.p99 < MAX_P99_MS;
  return summary;
}

async function main(): Promise<void> {
  applyEmulatorEnv();
  mkdirSync(OUT, { recursive: true });
  await seed();
  await seedManyEvents();
  const server = await startTestServer();
  try {
    const cookie = await sessionCookie("collaborator");
    const results = [
      await run("listado-eventos", "/api/events", cookie),
      await run("busqueda-eventos", "/api/events?clientName=bancolombia&year=2025&place=cali", cookie),
    ];
    const date = new Date().toISOString();
    const md = [
      `# Prueba de carga (RNF-05)`,
      ``,
      `Fecha: ${date}. ${CONNECTIONS} conexiones concurrentes, ${DURATION_S} s por endpoint, ${EVENTS + 3} eventos en Firestore Emulator.`,
      `Servidor: build de producción de Next (next start) en local. Criterio: 0 errores, 0 respuestas no 2xx, p99 < ${MAX_P99_MS} ms.`,
      ``,
      `| Endpoint | Peticiones | Req/s | Errores | No 2xx | p50 (ms) | p90 (ms) | p99 (ms) | Máx (ms) | Resultado |`,
      `|---|---|---|---|---|---|---|---|---|---|`,
      ...results.map((r) =>
        `| ${r.endpoint} | ${r.requests} | ${r.rps} | ${r.errors} | ${r.non2xx} | ${r.latency.p50} | ${r.latency.p90} | ${r.latency.p99} | ${r.latency.max} | ${r.ok ? "Aprobado" : "Fallido"} |`
      ),
      ``,
      `Limitación: el emulador de Firestore corre en un solo proceso Java local y no replica la latencia de red ni el escalado de Firestore en producción. Los números sirven para comparar versiones del código y detectar cuellos de botella del servidor, no como medida absoluta del sistema desplegado en Vercel.`,
      ``,
    ].join("\n");
    writeFileSync(`${OUT}/resumen-carga.md`, md);
    writeFileSync(`${OUT}/resumen-carga.json`, JSON.stringify({ date, connections: CONNECTIONS, durationS: DURATION_S, events: EVENTS + 3, results }, null, 2));
    console.log(md);
    if (results.some((r) => !r.ok)) process.exitCode = 1;
  } finally {
    stopTestServer(server);
    // Dejar el emulador con la semilla base para las demás pruebas
    await seed();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});

// Genera tests/RESULTADOS.md, tests/RESULTADOS.csv y tests/PRUEBAS_MANUALES.md
// a partir de los reportes reales de la última ejecución:
//   evidencias/pruebas/api/vitest-results.json      (npm run test)
//   evidencias/pruebas/e2e/playwright-results.json  (npm run test:e2e)
//   evidencias/pruebas/load/resumen-carga.json      (npm run test:load)
// Uso: npm run test:results
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CASES, MANUAL, type CaseMeta } from "./catalog";
import { HU, RF, RNF, REQUISITOS_PROVISIONALES } from "./requisitos";

type Estado = "Aprobado" | "Fallido" | "No ejecutado";
interface Outcome { estado: Estado; obtenido: string; fecha: string }

const ID_RE = /^([A-Z0-9]+(?:-[A-Z0-9]+)*) ·/;
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, "");
const firstLine = (s: string) => stripAnsi(s).split("\n").find((l) => l.trim())?.trim().slice(0, 160) ?? "";
const day = (ms: number | string) => new Date(ms).toISOString().slice(0, 10);

function readJson<T>(path: string): T | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : null;
}

const outcomes = new Map<string, Outcome>();

// ── Vitest ──────────────────────────────────────────────────────────────────
interface VitestJson {
  startTime: number;
  testResults: { assertionResults: { title: string; status: string; failureMessages: string[] }[] }[];
}
const vitest = readJson<VitestJson>("evidencias/pruebas/api/vitest-results.json");
if (vitest) {
  for (const file of vitest.testResults) {
    for (const t of file.assertionResults) {
      const id = ID_RE.exec(t.title)?.[1];
      if (!id) continue;
      if (t.status === "passed") {
        outcomes.set(id, { estado: "Aprobado", obtenido: "Igual al esperado", fecha: day(vitest.startTime) });
      } else if (t.status === "failed") {
        outcomes.set(id, { estado: "Fallido", obtenido: firstLine(t.failureMessages.join("\n")) || "failed", fecha: day(vitest.startTime) });
      }
    }
  }
}

// ── Playwright ──────────────────────────────────────────────────────────────
interface PwSpec { title: string; tests: { results: { status: string; error?: { message?: string } }[] }[] }
interface PwSuite { suites?: PwSuite[]; specs?: PwSpec[] }
interface PwJson { stats: { startTime: string }; suites: PwSuite[] }
const pw = readJson<PwJson>("evidencias/pruebas/e2e/playwright-results.json");
function walk(suite: PwSuite, date: string): void {
  for (const spec of suite.specs ?? []) {
    const id = ID_RE.exec(spec.title)?.[1];
    // Un spec corre en varios proyectos (escritorio, Android, iPhone): usar el
    // resultado del proyecto donde realmente se ejecutó
    const result = spec.tests
      .map((t) => t.results.at(-1))
      .find((r) => r !== undefined && r.status !== "skipped");
    if (!id || !result) continue;
    if (result.status === "passed") {
      outcomes.set(id, { estado: "Aprobado", obtenido: "Igual al esperado", fecha: date });
    } else if (result.status !== "skipped") {
      outcomes.set(id, { estado: "Fallido", obtenido: firstLine(result.error?.message ?? result.status), fecha: date });
    }
  }
  for (const s of suite.suites ?? []) walk(s, date);
}
if (pw) pw.suites.forEach((s) => walk(s, day(pw.stats.startTime)));

// ── Carga ───────────────────────────────────────────────────────────────────
interface LoadJson {
  date: string;
  results: { requests: number; rps: number; errors: number; non2xx: number; latency: { p50: number; p99: number }; ok: boolean }[];
}
const load = readJson<LoadJson>("evidencias/pruebas/load/resumen-carga.json");
if (load) {
  load.results.forEach((r, i) => {
    outcomes.set(`LOAD-0${i + 1}`, {
      estado: r.ok ? "Aprobado" : "Fallido",
      obtenido: `${r.requests} peticiones, ${r.rps} req/s, ${r.errors} errores, ${r.non2xx} no-2xx, p50 ${r.latency.p50} ms, p99 ${r.latency.p99} ms`,
      fecha: day(load.date),
    });
  });
}

const outcome = (c: CaseMeta): Outcome => outcomes.get(c.id) ?? { estado: "No ejecutado", obtenido: "Sin resultado en los reportes", fecha: "" };

// Pruebas ejecutadas sin entrada en el catálogo: se reportan para no perderlas
const unknown = Array.from(outcomes.keys()).filter((id) => !CASES.some((c) => c.id === id));

// ── Conteos y cobertura ─────────────────────────────────────────────────────
const rows = CASES.map((c) => ({ c, o: outcome(c) }));
const count = (e: Estado) => rows.filter((r) => r.o.estado === e).length;
const byType = Array.from(new Set(CASES.map((c) => c.tipo))).map((t) => {
  const r = rows.filter((x) => x.c.tipo === t);
  return { t, total: r.length, ok: r.filter((x) => x.o.estado === "Aprobado").length, ko: r.filter((x) => x.o.estado === "Fallido").length };
});

function coverage(ids: string[], pick: (c: { hu: string[]; req: string[] }) => string[]) {
  return ids.map((id) => {
    const auto = rows.filter((r) => pick(r.c).includes(id));
    const manual = MANUAL.filter((m) => pick(m).includes(id));
    return {
      id,
      auto: auto.length,
      ok: auto.filter((r) => r.o.estado === "Aprobado").length,
      manual: manual.length,
      cubierto: auto.length + manual.length > 0,
    };
  });
}
const covHU = coverage(Object.keys(HU), (c) => c.hu);
const covRF = coverage(Object.keys(RF), (c) => c.req);
const covRNF = coverage(Object.keys(RNF), (c) => c.req);
const covered = (c: { cubierto: boolean }[]) => `${c.filter((x) => x.cubierto).length}/${c.length}`;

// ── Markdown ────────────────────────────────────────────────────────────────
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const runDate = [vitest && day(vitest.startTime), pw && day(pw.stats.startTime), load && day(load.date)].filter(Boolean).join(" / ");

const md: string[] = [
  "# Resultados de pruebas — MAGIK Producciones",
  "",
  `Generado por \`npm run test:results\` a partir de los reportes de la última ejecución (${runDate || "sin ejecución"}).`,
  "Entorno: Firebase Emulator (proyecto `demo-magik`) y build de producción de Next en `localhost:3100`. Nunca se usó el proyecto de producción.",
  "",
  "## Resumen",
  "",
  "| Indicador | Valor |",
  "|---|---|",
  `| Total de casos automatizados | ${rows.length} |`,
  `| Aprobados | ${count("Aprobado")} |`,
  `| Fallidos | ${count("Fallido")} |`,
  `| No ejecutados | ${count("No ejecutado")} |`,
  `| Casos manuales (tests/PRUEBAS_MANUALES.md) | ${MANUAL.length}, pendientes de ejecutar |`,
  `| Cobertura por HU | ${covered(covHU)} |`,
  `| Cobertura por RF | ${covered(covRF)} |`,
  `| Cobertura por RNF | ${covered(covRNF)} |`,
  "",
  "| Tipo | Casos | Aprobados | Fallidos |",
  "|---|---|---|---|",
  ...byType.map((b) => `| ${b.t} | ${b.total} | ${b.ok} | ${b.ko} |`),
  "",
  ...(unknown.length ? [`Pruebas ejecutadas sin entrada en el catálogo: ${unknown.join(", ")}.`, ""] : []),
  "## Cobertura",
  "",
  ...(REQUISITOS_PROVISIONALES
    ? ["> **Requisitos provisionales.** Los enunciados de `tests/results/requisitos.ts` no son los oficiales.", ""]
    : []),
  "Una HU o requisito está cubierto si tiene al menos un caso automatizado o manual. Cubierto no significa que el criterio se cumpla por completo: ver «Brechas conocidas».",
  "",
  "### Por historia de usuario",
  "",
  "| HU | Descripción | Casos auto | Aprobados | Casos manuales |",
  "|---|---|---|---|---|",
  ...covHU.map((c) => `| ${c.id} | ${HU[c.id]} | ${c.auto} | ${c.ok} | ${c.manual} |`),
  "",
  "### Por requisito funcional",
  "",
  "| RF | Nombre | Prioridad | Roles | Casos auto | Aprobados | Casos manuales |",
  "|---|---|---|---|---|---|---|",
  ...covRF.map((c) => `| ${c.id} | ${RF[c.id].nombre} | ${RF[c.id].prioridad} | ${RF[c.id].roles} | ${c.auto} | ${c.ok} | ${c.manual} |`),
  "",
  "### Por requisito no funcional",
  "",
  "| RNF | Nombre | Casos auto | Aprobados | Casos manuales |",
  "|---|---|---|---|---|",
  ...covRNF.map((c) => `| ${c.id} | ${RNF[c.id].nombre} | ${c.auto} | ${c.ok} | ${c.manual} |`),
  "",
  "### Enunciados oficiales",
  "",
  "| ID | Nombre | Descripción | Prioridad | Roles |",
  "|---|---|---|---|---|",
  ...Object.entries(RF).map(([id, r]) => `| ${id} | ${r.nombre} | ${cell(r.descripcion)} | ${r.prioridad} | ${r.roles} |`),
  ...Object.entries(RNF).map(([id, r]) => `| ${id} | ${r.nombre} | ${cell(r.descripcion)} | — | — |`),
  "",
  "## Brechas conocidas",
  "",
  "Partes de los requisitos oficiales que no tienen una prueba aprobada porque la funcionalidad no existe o el alcance de la prueba es parcial:",
  "",
  "- **RNF-04**: los archivos tienen fecha visible (API-FIL-01), pero no un metadato de **versión**. `EventFile` no tiene ese campo; el control de versiones solo existe para plantillas.",
  "- **RF-11**: «reutilizar cotizaciones anteriores como base para nuevos clientes» no está implementado. Duplicar (API-COT-05) copia la cotización dentro del mismo evento; no hay opción para copiarla a otro evento o cliente.",
  "- **RNF-02**: se probó Chromium de escritorio, Chromium en Android y WebKit en iPhone. Firefox y Edge no se ejecutan en la suite.",
  "- **RNF-03**: el contenido de los PDF se verifica automáticamente (DOC-PDF-01 a 06); la fidelidad visual frente a la plantilla aprobada es manual (MAN-01, MAN-02).",
  "",
  "## Detalle de casos",
  "",
  "| ID | Tipo | HU | Criterio | RF/RNF | Flujo | Pasos | Esperado | Obtenido | Estado | Evidencia | Fecha |",
  "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ...rows.map(({ c, o }) =>
    `| ${c.id} | ${c.tipo} | ${c.hu.join(", ")} | ${cell(c.criterio)} | ${c.req.join(", ")} | ${cell(c.flujo)} | ${cell(c.pasos)} | ${cell(c.esperado)} | ${cell(o.obtenido)} | ${o.estado} | ${cell(c.evidencia)} | ${o.fecha} |`
  ),
  "",
];
writeFileSync("tests/RESULTADOS.md", md.join("\n"));

// ── CSV ─────────────────────────────────────────────────────────────────────
const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`;
const header = ["ID", "Tipo", "HU", "Criterio", "RF/RNF", "Flujo", "Pasos", "Esperado", "Obtenido", "Estado", "Evidencia", "Fecha"];
const csv = [
  header.map(csvCell).join(","),
  ...rows.map(({ c, o }) =>
    [c.id, c.tipo, c.hu.join(" "), c.criterio, c.req.join(" "), c.flujo, c.pasos, c.esperado, o.obtenido, o.estado, c.evidencia, o.fecha]
      .map(csvCell).join(",")
  ),
  ...MANUAL.map((m) =>
    [m.id, "Manual", m.hu.join(" "), m.titulo, m.req.join(" "), m.titulo, m.pasos.join(" / "), m.esperado, "", "Pendiente (manual)", `OneDrive: Pruebas manuales/${m.captura}`, ""]
      .map(csvCell).join(",")
  ),
];
// BOM para que Excel abra el UTF-8 con tildes correctamente
writeFileSync("tests/RESULTADOS.csv", "﻿" + csv.join("\r\n") + "\r\n");

// ── Pruebas manuales ────────────────────────────────────────────────────────
const manual: string[] = [
  "# Pruebas manuales — MAGIK Producciones",
  "",
  "Casos que no tiene sentido automatizar: aspecto visual, interacción física (arrastrar, celular real) o tiempos de una persona. Ejecutarlos contra el entorno que se va a entregar (producción o una copia), no contra el emulador.",
  "",
  "Para cada caso: seguir los pasos, marcar el resultado, anotar observaciones y guardar la captura con el nombre indicado en `OneDrive: Pruebas manuales/`.",
  "",
  "**Ejecutado por:** ____________________ **Fecha:** ____________ **Entorno / URL:** ____________________",
  "",
  "| ID | HU | RF/RNF | Caso | Captura | Resultado |",
  "|---|---|---|---|---|---|",
  ...MANUAL.map((m) => `| ${m.id} | ${m.hu.join(", ") || "—"} | ${m.req.join(", ")} | ${m.titulo} | ${m.captura} | ☐ Aprobado ☐ Fallido |`),
  "",
  ...MANUAL.flatMap((m) => [
    `## ${m.id} · ${m.titulo}`,
    "",
    `**HU:** ${m.hu.join(", ") || "—"} · **RF/RNF:** ${m.req.join(", ")} · **Captura:** \`OneDrive: Pruebas manuales/${m.captura}\``,
    "",
    `**Precondiciones:** ${m.precondiciones}`,
    "",
    "**Pasos:**",
    "",
    ...m.pasos.map((p, i) => `${i + 1}. ${p}`),
    "",
    `**Resultado esperado:** ${m.esperado}`,
    "",
    "- [ ] Aprobado",
    "- [ ] Fallido",
    "",
    "**Observaciones:** ______________________________________________",
    "",
  ]),
];
writeFileSync("tests/PRUEBAS_MANUALES.md", manual.join("\n"));

console.log(
  `RESULTADOS: ${rows.length} casos · ${count("Aprobado")} aprobados · ${count("Fallido")} fallidos · ${count("No ejecutado")} no ejecutados · ` +
    `HU ${covered(covHU)} · RF ${covered(covRF)} · RNF ${covered(covRNF)} · manuales ${MANUAL.length}` +
    (unknown.length ? ` · sin catálogo: ${unknown.join(", ")}` : "")
);
if (count("Fallido") > 0 || count("No ejecutado") > 0 || unknown.length > 0) process.exitCode = 1;

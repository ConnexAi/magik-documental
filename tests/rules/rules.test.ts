import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getBytes, ref, uploadString } from "firebase/storage";
import { PROJECT_ID } from "../support/env";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
  // Plantilla existente para las pruebas de lectura
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadString(ref(ctx.storage(), TEMPLATE_PATH), "plantilla v1");
  });
});

const TEMPLATE_PATH = "templates/tpl-0001/cotizacion-v1.docx";

afterAll(async () => {
  await env.cleanup();
});

describe("Reglas de Firestore y Storage (RNF-06)", () => {
  it("RUL-01 · Un cliente autenticado no puede leer Firestore directamente", async () => {
    const db = env.authenticatedContext("colab", { role: "collaborator" }).firestore();
    await assertFails(getDoc(doc(db, "events/evt-0001")));
  });

  it("RUL-02 · Ni un admin puede escribir Firestore desde el navegador", async () => {
    const db = env.authenticatedContext("admin", { role: "admin" }).firestore();
    await assertFails(setDoc(doc(db, "users/x"), { role: "admin" }));
  });

  it("RUL-03 · Storage rechaza subidas sin sesión", async () => {
    const storage = env.unauthenticatedContext().storage();
    await assertFails(uploadString(ref(storage, "events/evt-0001/x.txt"), "hola"));
  });

  it("RUL-04 · Storage permite subidas a usuarios autenticados", async () => {
    const storage = env.authenticatedContext("colab").storage();
    await assertSucceeds(uploadString(ref(storage, "events/evt-0001/x.txt"), "hola"));
  });

  it("RUL-05 · Colaborador intenta escribir en templates/ → falla", async () => {
    const storage = env.authenticatedContext("colab", { role: "collaborator" }).storage();
    await assertFails(uploadString(ref(storage, "templates/tpl-0001/intento-colab.docx"), "x"));
  });

  it("RUL-06 · Admin escribe en templates/ → pasa", async () => {
    const storage = env.authenticatedContext("admin", { role: "admin" }).storage();
    await assertSucceeds(uploadString(ref(storage, "templates/tpl-0001/cotizacion-v2.docx"), "plantilla v2"));
  });

  it("RUL-07 · Admin lee de templates/ → pasa", async () => {
    const storage = env.authenticatedContext("admin", { role: "admin" }).storage();
    await assertSucceeds(getBytes(ref(storage, TEMPLATE_PATH)));
  });

  it("RUL-08 · Colaborador lee de templates/ → pasa", async () => {
    const storage = env.authenticatedContext("colab", { role: "collaborator" }).storage();
    await assertSucceeds(getBytes(ref(storage, TEMPLATE_PATH)));
  });

  it("RUL-09 · Sin sesión intenta leer templates/ → falla", async () => {
    const storage = env.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(storage, TEMPLATE_PATH)));
  });

  it("RUL-10 · Usuario autenticado sin rol admin no escribe fuera de events/ y templates/", async () => {
    const storage = env.authenticatedContext("colab", { role: "collaborator" }).storage();
    await assertFails(uploadString(ref(storage, "otra-ruta/x.txt"), "x"));
  });
});

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";
import { PROJECT_ID } from "../support/env";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("Reglas de Firestore y Storage (RNF-02)", () => {
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
});

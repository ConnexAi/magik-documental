import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { SEED } from "../emulator/seed";
import { USERS } from "../support/env";
import { getIdToken } from "../support/auth";
import type { EventFile } from "@/lib/types";

const F = `/api/events/${SEED.events[0]}/files`;
const STORAGE_URL = "https://storage.test/events/evt-0001/rider-tecnico.pdf";

function uidFromToken(token: string): string {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as { user_id: string };
  return payload.user_id;
}

describe("Archivos por evento (HU-12, HU-13)", () => {
  let file: EventFile;

  it("API-FIL-01 · Subir archivo registra nombre, categoría, fecha y autor", async () => {
    const res = await call("collaborator", "post", F, {
      name: "rider-tecnico.pdf", category: "Rider", storageUrl: STORAGE_URL,
      mimeType: "application/pdf", sizeBytes: 52_340,
    });
    expect(res.status).toBe(201);
    file = (res.body as { file: EventFile }).file;
    expect(file.name).toBe("rider-tecnico.pdf");
    expect(file.category).toBe("Rider");
    expect(Number.isNaN(Date.parse(file.createdAt))).toBe(false);
    expect(file.uploadedBy).toBe(uidFromToken(await getIdToken("collaborator")));
    expect(file.uploadedByName).toBe(USERS.collaborator.displayName);
  });

  it("API-FIL-02 · Se puede usar una categoría nueva (personalizada)", async () => {
    const res = await call("collaborator", "post", F, {
      name: "plano-escenario.dwg", category: "Planos", storageUrl: "https://storage.test/p.dwg",
      mimeType: "application/acad", sizeBytes: 1000,
    });
    expect(res.status).toBe(201);
    expect((res.body as { file: EventFile }).file.category).toBe("Planos");
  });

  it("API-FIL-06 · Buscar dentro del evento por tipo de documento (categoría)", async () => {
    const fotos = (await call("collaborator", "get", `${F}?category=Foto`)).body as { files: EventFile[] };
    expect(fotos.files.length).toBeGreaterThan(0);
    expect(fotos.files.every((f) => f.category === "Foto")).toBe(true);
    const riders = (await call("collaborator", "get", `${F}?category=Rider`)).body as { files: EventFile[] };
    expect(riders.files.map((f) => f.id)).toEqual([file.id]);
  });

  it("API-FIL-03 · Renombrar no altera el archivo almacenado ni su enlace", async () => {
    const res = await call("collaborator", "patch", `${F}/${file.id}`, { name: "rider-v2.pdf" });
    expect(res.status).toBe(200);
    const renamed = (res.body as { file: EventFile }).file;
    expect(renamed.name).toBe("rider-v2.pdf");
    expect(renamed.storageUrl).toBe(STORAGE_URL);
    expect(renamed.sizeBytes).toBe(file.sizeBytes);
  });

  it("API-FIL-04 · Colaborador elimina archivo → 403", async () => {
    const res = await call("collaborator", "delete", `${F}/${file.id}`);
    expect(res.status).toBe(403);
  });

  it("API-FIL-05 · Admin elimina archivo → 200", async () => {
    const res = await call("admin", "delete", `${F}/${file.id}`);
    expect(res.status).toBe(200);
    const list = (await call("admin", "get", F)).body as { files: EventFile[] };
    expect(list.files.map((f) => f.id)).not.toContain(file.id);
  });
});

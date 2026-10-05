import { describe, expect, it } from "vitest";
import { call } from "../support/http";
import { SEED } from "../emulator/seed";
import { USERS } from "../support/env";
import type { Template, TemplateVersion } from "@/lib/types";

const T = `/api/templates/${SEED.templateId}`;
const V2_URL = "https://storage.test/templates/cotizacion-v2.docx";

describe("Plantillas (HU-05, HU-06, HU-18)", () => {
  it("API-TPL-01 · Colaborador publica versión → 403 y la versión activa no cambia", async () => {
    const res = await call("collaborator", "post", `${T}/versions`, { version: 2, storageUrl: V2_URL });
    expect(res.status).toBe(403);
    const t = (await call("collaborator", "get", T)).body as { template: Template };
    expect(t.template.activeVersion).toBe(1);
  });

  it("API-TPL-02 · Admin publica versión → la nueva queda activa", async () => {
    const res = await call("admin", "post", `${T}/versions`, { version: 2, storageUrl: V2_URL, changelog: "Nuevo logo y condiciones" });
    expect(res.status).toBe(201);
    const t = (await call("admin", "get", T)).body as { template: Template };
    expect(t.template.activeVersion).toBe(2);
    expect(t.template.storageUrl).toBe(V2_URL);
  });

  it("API-TPL-03 · La versión anterior pasa al historial", async () => {
    const res = await call("admin", "get", `${T}/versions`);
    const versions = (res.body as { versions: TemplateVersion[] }).versions;
    expect(versions.map((v) => v.version)).toEqual([2, 1]);
  });

  it("API-TPL-04 · El historial tiene número, fecha, autor y nota de cambios", async () => {
    const res = await call("admin", "get", `${T}/versions`);
    const [v2] = (res.body as { versions: TemplateVersion[] }).versions;
    expect(v2.version).toBe(2);
    expect(Number.isNaN(Date.parse(v2.publishedAt))).toBe(false);
    expect(v2.publishedByName).toBe(USERS.admin.displayName);
    expect(v2.changelog).toBe("Nuevo logo y condiciones");
  });

  it("API-TPL-05 · GET de plantilla para colaborador expone solo la versión activa", async () => {
    const res = await call("collaborator", "get", T);
    expect(res.status).toBe(200);
    const t = (res.body as { template: Template }).template;
    expect(t.storageUrl).toBe(V2_URL);
    expect(JSON.stringify(res.body)).not.toContain("cotizacion-v1.docx");
    expect(Object.keys(t)).not.toContain("versions");
  });

  it("API-TPL-07 · Colaborador no obtiene el historial de versiones antiguas", async () => {
    const res = await call("collaborator", "get", `${T}/versions`);
    expect(res.status).toBe(403);
    expect(res.text).not.toContain("cotizacion-v1.docx");
  });

  it("API-TPL-06 · El listado de plantillas para colaborador no incluye versiones antiguas", async () => {
    const res = await call("collaborator", "get", "/api/templates");
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("cotizacion-v1.docx");
  });
});

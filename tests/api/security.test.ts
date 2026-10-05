import { beforeAll, describe, expect, it } from "vitest";
import { MATRIX, SEC, prepareSecurityFixtures, type MatrixRow } from "./security-matrix";
import { api, call } from "../support/http";
import { FORGED_TOKEN_COOKIE } from "../support/auth";

export function secId(index: number, scenario: 1 | 2 | 3 | 4): string {
  return `SEC-${String(index + 1).padStart(2, "0")}-${scenario}`;
}

const label = (r: MatrixRow) => `${r.method.toUpperCase()} ${r.path}`;
const isOk = (s: number) => s >= 200 && s < 300;

beforeAll(async () => {
  await prepareSecurityFixtures();
});

describe("Matriz de seguridad (RNF-02)", () => {
  MATRIX.forEach((row, i) => {
    describe(label(row), () => {
      it(`${secId(i, 1)} · sin sesión → ${row.level === "public" ? row.anonStatus : 401}`, async () => {
        const res = await call("anon", row.method, row.path, await row.body?.());
        expect(res.status).toBe(row.level === "public" ? row.anonStatus : 401);
        if (row.level !== "public") expect(res.body).toEqual({ error: "no_session" });
      });

      it(`${secId(i, 2)} · cookie magik_role=admin falsa sin token → ${row.level === "public" ? row.anonStatus : 401}`, async () => {
        const res = await call("forged", row.method, row.path, await row.body?.());
        expect(res.status).toBe(row.level === "public" ? row.anonStatus : 401);
      });

      if (row.level === "admin") {
        it(`${secId(i, 3)} · token de colaborador en ruta de admin → 403`, async () => {
          const res = await call("collaborator", row.method, row.path, await row.body?.());
          expect(res.status).toBe(403);
          expect(res.body).toEqual({ error: "forbidden" });
        });
      } else if (row.level === "session") {
        it(`${secId(i, 3)} · token de colaborador en ruta de sesión → permitido`, async () => {
          // Lectura o creación permitida; no repetimos efectos destructivos
          const res = await call("collaborator", row.method, row.path, await row.body?.());
          expect(isOk(res.status)).toBe(true);
        });
      }

      it(`${secId(i, 4)} · token de admin → ${row.adminStatus}`, async () => {
        const res = await call("admin", row.method, row.path, await row.body?.());
        expect(res.status).toBe(row.adminStatus);
      });
    });
  });
});

describe("Casos críticos explícitos", () => {
  it("SEC-X1 · POST /api/auth/set-role con cookie magik_role=admin falsa → 401", async () => {
    const res = await api()
      .post("/api/auth/set-role")
      .set("Cookie", "magik_role=admin")
      .send({ uid: SEC.user, role: "admin" });
    expect(res.status).toBe(401);
  });

  it("SEC-X2 · POST /api/auth/set-role con token inventado y rol admin → 401", async () => {
    const res = await api()
      .post("/api/auth/set-role")
      .set("Cookie", FORGED_TOKEN_COOKIE)
      .send({ uid: SEC.user, role: "admin" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "invalid_session" });
  });

  it("SEC-X3 · DELETE /api/events/[id] sin sesión → 401", async () => {
    const res = await api().delete(`/api/events/${SEC.event}`);
    expect(res.status).toBe(401);
  });

  it("SEC-X4 · DELETE /api/catalog/rubros/[id] con token de colaborador → 403", async () => {
    const res = await call("collaborator", "delete", `/api/catalog/rubros/${SEC.rubro}`);
    expect(res.status).toBe(403);
  });

  it("SEC-X5 · GET /api/portfolio sin sesión → 200 (público)", async () => {
    const res = await api().get("/api/portfolio");
    expect(res.status).toBe(200);
  });

  it("SEC-X6 · Página /dashboard/admin/users con cookies falsas no expone datos (redirige a /login)", async () => {
    const res = await api()
      .get("/dashboard/admin/users")
      .set("Cookie", FORGED_TOKEN_COOKIE)
      .redirects(0);
    expect([302, 303, 307, 308]).toContain(res.status);
    expect(res.headers.location).toContain("/login");
    expect(res.text).not.toContain("test-admin@magikenter.com");
  });
});

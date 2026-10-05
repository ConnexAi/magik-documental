// Matriz de seguridad: cada ruta y método de app/api con su nivel de acceso.
// La usan security.test.ts (ejecución) y tests/results/build-results.ts
// (tabla RESULTADOS.md), así ambas siempre describen las mismas rutas.
import { testAuth, testDb } from "../support/admin";
import { SEED_CATALOG, SEED_QUOTE_ITEMS } from "../emulator/seed";
import type { CatalogRubro } from "@/lib/types";

export type Level = "public" | "session" | "admin";

export interface MatrixRow {
  method: "get" | "post" | "patch" | "put" | "delete";
  path: string;
  level: Level;
  hu: string;
  rf: string;
  // Respuesta esperada para un admin con token válido
  adminStatus: number;
  body?: () => unknown | Promise<unknown>;
  // Público con comportamiento propio sin sesión (p. ej. /api/auth/session)
  anonStatus?: number;
}

export const SEC = {
  user: "sec-user",
  userDel: "sec-user-del",
  event: "evt-sec",
  eventDel: "evt-sec-del",
  quote: "quote-sec",
  quoteDel: "quote-sec-del",
  order: "order-sec",
  orderDel: "order-sec-del",
  file: "file-sec",
  fileDel: "file-sec-del",
  rubro: "rubro-sec",
  rubroDel: "rubro-sec-del",
  product: "prod-sec",
  provider: "prov-sec",
  providerDel: "prov-sec-del",
  client: "cli-sec",
  clientDel: "cli-sec-del",
  template: "tpl-sec",
  templateDel: "tpl-sec-del",
  portfolio: "pf-sec",
  portfolioDel: "pf-sec-del",
} as const;

const NOW = "2026-01-10T15:00:00.000Z";
const E = `/api/events/${SEC.event}`;

const eventBody = () => ({
  eventName: "Evento matriz", clientName: "Cliente Matriz", eventType: "corporativo",
  place: "Cali", date: "2026-05-05",
});
const quoteBody = () => ({
  title: "Cot matriz", attention: "A", attentionRole: "B", subject: "C",
  items: SEED_QUOTE_ITEMS, hasIva: false, subtotal: 0, total: 0,
});
const orderBody = () => ({
  providerId: SEC.provider, providerName: "Prov matriz", title: "OS matriz", items: [SEED_QUOTE_ITEMS[0]],
});

export const MATRIX: MatrixRow[] = [
  // ── Auth ─────────────────────────────────────────────────────────────────
  { method: "post", path: "/api/auth/session", level: "public", hu: "HU-09", rf: "RF-07", adminStatus: 401, anonStatus: 401, body: () => ({ idToken: "invalido" }) },
  { method: "post", path: "/api/auth/logout", level: "public", hu: "HU-09", rf: "RF-07", adminStatus: 200, anonStatus: 200 },
  { method: "post", path: "/api/auth/set-role", level: "admin", hu: "HU-09", rf: "RF-07", adminStatus: 200, body: () => ({ uid: SEC.user, role: "collaborator" }) },
  // ── Usuarios ─────────────────────────────────────────────────────────────
  { method: "get", path: "/api/admin/users", level: "admin", hu: "HU-09", rf: "RF-07", adminStatus: 200 },
  { method: "post", path: "/api/admin/users", level: "admin", hu: "HU-09", rf: "RF-07", adminStatus: 201, body: () => ({ email: "sec-nuevo@magikenter.com", password: "Test1234!", displayName: "Nuevo Matriz", role: "collaborator" }) },
  { method: "patch", path: `/api/admin/users/${SEC.user}`, level: "admin", hu: "HU-09", rf: "RF-07", adminStatus: 200, body: () => ({ active: true }) },
  { method: "delete", path: `/api/admin/users/${SEC.userDel}`, level: "admin", hu: "HU-09", rf: "RF-07", adminStatus: 200 },
  // ── Eventos ──────────────────────────────────────────────────────────────
  { method: "get", path: "/api/events", level: "session", hu: "HU-10", rf: "RF-02", adminStatus: 200 },
  { method: "post", path: "/api/events", level: "session", hu: "HU-01", rf: "RF-01", adminStatus: 201, body: eventBody },
  { method: "get", path: E, level: "session", hu: "HU-02", rf: "RF-01", adminStatus: 200 },
  { method: "patch", path: E, level: "session", hu: "HU-01", rf: "RF-01", adminStatus: 200, body: () => ({ place: "Palmira" }) },
  { method: "delete", path: `/api/events/${SEC.eventDel}`, level: "admin", hu: "HU-01", rf: "RF-01", adminStatus: 200 },
  // ── Cotizaciones ─────────────────────────────────────────────────────────
  { method: "get", path: `${E}/quotes`, level: "session", hu: "HU-03", rf: "RF-06", adminStatus: 200 },
  { method: "post", path: `${E}/quotes`, level: "session", hu: "HU-03", rf: "RF-06", adminStatus: 201, body: quoteBody },
  { method: "get", path: `${E}/quotes/${SEC.quote}`, level: "session", hu: "HU-03", rf: "RF-06", adminStatus: 200 },
  { method: "patch", path: `${E}/quotes/${SEC.quote}`, level: "session", hu: "HU-03", rf: "RF-06", adminStatus: 200, body: () => ({ title: "Editada" }) },
  { method: "delete", path: `${E}/quotes/${SEC.quoteDel}`, level: "admin", hu: "HU-03", rf: "RF-06", adminStatus: 200 },
  { method: "post", path: `${E}/quotes/${SEC.quote}/duplicate`, level: "session", hu: "HU-11", rf: "RF-02", adminStatus: 201 },
  { method: "get", path: `${E}/quotes/${SEC.quote}/pdf`, level: "session", hu: "HU-03", rf: "RF-06", adminStatus: 200 },
  { method: "get", path: `${E}/quotes/${SEC.quote}/xlsx`, level: "session", hu: "HU-03", rf: "RF-06", adminStatus: 200 },
  // ── Órdenes ──────────────────────────────────────────────────────────────
  { method: "get", path: `${E}/orders`, level: "session", hu: "HU-04", rf: "RF-06", adminStatus: 200 },
  { method: "post", path: `${E}/orders`, level: "session", hu: "HU-04", rf: "RF-06", adminStatus: 201, body: orderBody },
  { method: "get", path: `${E}/orders/${SEC.order}`, level: "session", hu: "HU-04", rf: "RF-06", adminStatus: 200 },
  { method: "patch", path: `${E}/orders/${SEC.order}`, level: "session", hu: "HU-04", rf: "RF-06", adminStatus: 200, body: () => ({ title: "Editada" }) },
  { method: "delete", path: `${E}/orders/${SEC.orderDel}`, level: "admin", hu: "HU-04", rf: "RF-06", adminStatus: 200 },
  { method: "get", path: `${E}/orders/${SEC.order}/pdf`, level: "session", hu: "HU-04", rf: "RF-06", adminStatus: 200 },
  { method: "get", path: `${E}/orders/${SEC.order}/xlsx`, level: "session", hu: "HU-04", rf: "RF-06", adminStatus: 200 },
  // ── Archivos ─────────────────────────────────────────────────────────────
  { method: "get", path: `${E}/files`, level: "session", hu: "HU-12", rf: "RF-08", adminStatus: 200 },
  { method: "post", path: `${E}/files`, level: "session", hu: "HU-12", rf: "RF-08", adminStatus: 201, body: () => ({ name: "matriz.pdf", category: "Otro", storageUrl: "https://storage.test/m.pdf", mimeType: "application/pdf", sizeBytes: 10 }) },
  { method: "patch", path: `${E}/files/${SEC.file}`, level: "session", hu: "HU-13", rf: "RF-08", adminStatus: 200, body: () => ({ name: "renombrado.pdf" }) },
  { method: "delete", path: `${E}/files/${SEC.fileDel}`, level: "admin", hu: "HU-13", rf: "RF-08", adminStatus: 200 },
  // ── Catálogo ─────────────────────────────────────────────────────────────
  { method: "get", path: "/api/catalog", level: "session", hu: "HU-07", rf: "RF-05", adminStatus: 200 },
  { method: "put", path: "/api/catalog", level: "admin", hu: "HU-07", rf: "RF-05", adminStatus: 200, body: async () => ({ rubros: await currentCatalog() }) },
  { method: "post", path: "/api/catalog/rubros", level: "session", hu: "HU-08", rf: "RF-05", adminStatus: 201, body: () => ({ name: "Rubro matriz", products: [] }) },
  { method: "patch", path: `/api/catalog/rubros/${SEC.rubro}`, level: "admin", hu: "HU-07", rf: "RF-05", adminStatus: 200, body: () => ({ name: "Rubro sec editado" }) },
  { method: "delete", path: `/api/catalog/rubros/${SEC.rubroDel}`, level: "admin", hu: "HU-07", rf: "RF-05", adminStatus: 200 },
  { method: "post", path: `/api/catalog/rubros/${SEC.rubro}/products`, level: "session", hu: "HU-08", rf: "RF-05", adminStatus: 201, body: () => ({ name: "Producto matriz", unit: "Unidad", defaultPrice: 1000 }) },
  { method: "patch", path: `/api/catalog/rubros/${SEC.rubro}/products/${SEC.product}`, level: "admin", hu: "HU-07", rf: "RF-05", adminStatus: 200, body: () => ({ defaultPrice: 2000 }) },
  { method: "delete", path: `/api/catalog/rubros/${SEC.rubro}/products/${SEC.product}`, level: "admin", hu: "HU-07", rf: "RF-05", adminStatus: 200 },
  // ── Proveedores ──────────────────────────────────────────────────────────
  { method: "get", path: "/api/providers", level: "session", hu: "HU-16", rf: "RF-10", adminStatus: 200 },
  { method: "post", path: "/api/providers", level: "admin", hu: "HU-16", rf: "RF-10", adminStatus: 201, body: () => ({ name: "Proveedor matriz", categories: [] }) },
  { method: "patch", path: `/api/providers/${SEC.provider}`, level: "admin", hu: "HU-16", rf: "RF-10", adminStatus: 200, body: () => ({ phone: "3000000000" }) },
  { method: "delete", path: `/api/providers/${SEC.providerDel}`, level: "admin", hu: "HU-16", rf: "RF-10", adminStatus: 200 },
  // ── Clientes ─────────────────────────────────────────────────────────────
  { method: "get", path: "/api/clients", level: "session", hu: "HU-17", rf: "RF-11", adminStatus: 200 },
  { method: "post", path: "/api/clients", level: "session", hu: "HU-17", rf: "RF-11", adminStatus: 201, body: () => ({ name: "Cliente matriz", eventIds: [] }) },
  { method: "get", path: `/api/clients/${SEC.client}`, level: "session", hu: "HU-17", rf: "RF-11", adminStatus: 200 },
  { method: "patch", path: `/api/clients/${SEC.client}`, level: "admin", hu: "HU-17", rf: "RF-11", adminStatus: 200, body: () => ({ phone: "3000000000" }) },
  { method: "delete", path: `/api/clients/${SEC.clientDel}`, level: "admin", hu: "HU-17", rf: "RF-11", adminStatus: 200 },
  // ── Plantillas ───────────────────────────────────────────────────────────
  { method: "get", path: "/api/templates", level: "session", hu: "HU-06", rf: "RF-03", adminStatus: 200 },
  { method: "post", path: "/api/templates", level: "admin", hu: "HU-05", rf: "RF-03", adminStatus: 201, body: () => ({ name: "Plantilla matriz", type: "quote", activeVersion: 1, storageUrl: "" }) },
  { method: "get", path: `/api/templates/${SEC.template}`, level: "session", hu: "HU-06", rf: "RF-03", adminStatus: 200 },
  { method: "patch", path: `/api/templates/${SEC.template}`, level: "admin", hu: "HU-05", rf: "RF-03", adminStatus: 200, body: () => ({ name: "Plantilla sec editada" }) },
  { method: "delete", path: `/api/templates/${SEC.templateDel}`, level: "admin", hu: "HU-05", rf: "RF-03", adminStatus: 200 },
  { method: "get", path: `/api/templates/${SEC.template}/versions`, level: "admin", hu: "HU-18", rf: "RF-04", adminStatus: 200 },
  { method: "post", path: `/api/templates/${SEC.template}/versions`, level: "admin", hu: "HU-05", rf: "RF-04", adminStatus: 201, body: () => ({ version: 2, storageUrl: "https://storage.test/sec-v2.docx", changelog: "matriz" }) },
  // ── Portafolio ───────────────────────────────────────────────────────────
  { method: "get", path: "/api/portfolio", level: "public", hu: "HU-15", rf: "RF-09", adminStatus: 200, anonStatus: 200 },
  { method: "post", path: "/api/portfolio", level: "admin", hu: "HU-14", rf: "RF-09", adminStatus: 201, body: () => ({ eventId: SEC.event, eventName: "Matriz", imageUrls: [], visible: false, order: 9 }) },
  { method: "patch", path: `/api/portfolio/${SEC.portfolio}`, level: "admin", hu: "HU-14", rf: "RF-09", adminStatus: 200, body: () => ({ visible: false }) },
  { method: "delete", path: `/api/portfolio/${SEC.portfolioDel}`, level: "admin", hu: "HU-14", rf: "RF-09", adminStatus: 200 },
];

async function currentCatalog(): Promise<CatalogRubro[]> {
  const doc = await testDb().collection("catalog").doc("rubros").get();
  return (doc.data() as { items: CatalogRubro[] }).items;
}

// Recursos desechables sobre los que la matriz ejecuta operaciones de admin
export async function prepareSecurityFixtures(): Promise<void> {
  const db = testDb();
  const auth = testAuth();
  for (const uid of [SEC.user, SEC.userDel]) {
    await auth.deleteUser(uid).catch(() => {});
    await auth.createUser({ uid, email: `${uid}@magikenter.com`, password: "Test1234!", displayName: uid });
    await db.collection("users").doc(uid).set({
      uid, email: `${uid}@magikenter.com`, displayName: uid, role: "collaborator",
      active: true, createdAt: NOW, updatedAt: NOW,
    });
  }
  const ev = (id: string) => ({
    id, consecutive: "EVT-9000", clientName: "Matriz", eventType: "corporativo",
    place: "Cali", date: "2026-01-01", createdBy: "seed", createdAt: NOW, updatedAt: NOW,
  });
  const batch = db.batch();
  batch.set(db.collection("events").doc(SEC.event), ev(SEC.event));
  batch.set(db.collection("events").doc(SEC.eventDel), ev(SEC.eventDel));
  const quote = (id: string) => ({
    id, eventId: SEC.event, consecutive: "COT-900-2026", title: "Sec", version: 1, status: "draft",
    attention: "A", attentionRole: "B", subject: "C", items: SEED_QUOTE_ITEMS, subtotal: 0, total: 0,
    createdBy: "seed", createdAt: NOW, updatedAt: NOW,
  });
  const quotes = db.collection("events").doc(SEC.event).collection("quotes");
  batch.set(quotes.doc(SEC.quote), quote(SEC.quote));
  batch.set(quotes.doc(SEC.quoteDel), quote(SEC.quoteDel));
  const order = (id: string) => ({
    id, eventId: SEC.event, orderConsecutive: "OS-900-2026", providerId: SEC.provider,
    providerName: "Prov", title: "Sec", items: [SEED_QUOTE_ITEMS[0]],
    createdBy: "seed", createdAt: NOW, updatedAt: NOW,
  });
  const orders = db.collection("events").doc(SEC.event).collection("serviceOrders");
  batch.set(orders.doc(SEC.order), order(SEC.order));
  batch.set(orders.doc(SEC.orderDel), order(SEC.orderDel));
  const file = (id: string) => ({
    id, eventId: SEC.event, name: `${id}.pdf`, category: "Otro", storageUrl: "https://storage.test/x.pdf",
    mimeType: "application/pdf", sizeBytes: 1, uploadedBy: "seed", createdAt: NOW,
  });
  const files = db.collection("events").doc(SEC.event).collection("files");
  batch.set(files.doc(SEC.file), file(SEC.file));
  batch.set(files.doc(SEC.fileDel), file(SEC.fileDel));
  for (const id of [SEC.provider, SEC.providerDel]) {
    batch.set(db.collection("providers").doc(id), { id, name: id, categories: [], createdAt: NOW, updatedAt: NOW });
  }
  for (const id of [SEC.client, SEC.clientDel]) {
    batch.set(db.collection("clients").doc(id), { id, name: id, eventIds: [SEC.event], createdAt: NOW, updatedAt: NOW });
  }
  for (const id of [SEC.template, SEC.templateDel]) {
    batch.set(db.collection("templates").doc(id), { id, name: id, type: "quote", activeVersion: 1, storageUrl: "", createdAt: NOW, updatedAt: NOW });
  }
  for (const id of [SEC.portfolio, SEC.portfolioDel]) {
    batch.set(db.collection("portfolio").doc(id), { id, eventId: SEC.event, eventName: id, imageUrls: [], visible: false, order: 50, publishedAt: NOW });
  }
  const catalog = [
    ...SEED_CATALOG,
    { id: SEC.rubro, name: "Rubro sec", products: [{ id: SEC.product, name: "Producto sec", unit: "Unidad", defaultPrice: 1 }] },
    { id: SEC.rubroDel, name: "Rubro sec borrar", products: [] },
  ];
  batch.set(db.collection("catalog").doc("rubros"), { items: catalog });
  await batch.commit();
}

// Datos semilla para el Firebase Emulator. Se usa desde el globalSetup de
// Vitest y Playwright, o sola con npm run test:seed (run-seed.ts).
import { testAuth, testDb } from "../support/admin";
import { USERS } from "../support/env";
import { assertEmulatorsRunning, clearEmulators } from "../support/emulator";
import { computeQuoteTotals } from "@/lib/quote-totals";
import type {
  MagikUser,
  MagikEvent,
  Quote,
  ServiceOrder,
  CatalogRubro,
  Provider,
  Client,
  Template,
  TemplateVersion,
  PortfolioItem,
  EventFile,
  DocumentItem,
} from "@/lib/types";

const NOW = "2026-01-10T15:00:00.000Z";

export const SEED = {
  events: ["evt-0001", "evt-0002", "evt-0003"],
  quoteId: "quote-0001",
  orderId: "order-0001",
  providerId: "prov-0001",
  clientId: "cli-0001",
  templateId: "tpl-0001",
  fileId: "file-0001",
  portfolioVisible: "pf-visible",
  portfolioHidden: "pf-hidden",
  rubros: { audio: "rubro-audio", luces: "rubro-iluminacion" },
} as const;

export const SEED_EVENTS: Omit<MagikEvent, "createdBy">[] = [
  {
    id: SEED.events[0], consecutive: "EVT-0001", eventName: "Convención anual Bancolombia",
    clientName: "Bancolombia", eventType: "corporativo",
    place: "Centro de Eventos Valle del Pacífico, Cali", date: "2026-03-15",
    createdAt: NOW, updatedAt: NOW,
  },
  {
    id: SEED.events[1], consecutive: "EVT-0002", eventName: "Feria de Cali - Concierto",
    clientName: "Corfecali", eventType: "entretenimiento",
    place: "Estadio Pascual Guerrero, Cali", date: "2025-12-27",
    createdAt: NOW, updatedAt: NOW,
  },
  {
    id: SEED.events[2], consecutive: "EVT-0003", eventName: "Grados UAO",
    clientName: "Universidad Autónoma de Occidente", eventType: "especial",
    place: "Auditorio UAO, Jamundí", date: "2026-08-20",
    createdAt: NOW, updatedAt: NOW,
  },
];

export const SEED_CATALOG: CatalogRubro[] = [
  {
    id: SEED.rubros.audio,
    name: "Audio",
    products: [
      { id: "prod-consola", name: "Consola digital 32 canales", unit: "Unidad", defaultPrice: 1_200_000 },
      { id: "prod-linearray", name: "Parlante line array", unit: "Unidad", defaultPrice: 350_000 },
    ],
  },
  {
    id: SEED.rubros.luces,
    name: "Iluminación",
    products: [
      { id: "prod-cabeza", name: "Cabeza móvil beam", unit: "Unidad", defaultPrice: 180_000 },
    ],
  },
];

function item(rubro: CatalogRubro, productIdx: number, quantity: number): DocumentItem {
  const p = rubro.products[productIdx];
  return {
    rubroId: rubro.id, rubroName: rubro.name, productId: p.id, productName: p.name,
    unit: p.unit, quantity, unitPrice: p.defaultPrice, total: quantity * p.defaultPrice,
  };
}

export const SEED_QUOTE_ITEMS: DocumentItem[] = [
  item(SEED_CATALOG[0], 0, 1), // 1.200.000
  item(SEED_CATALOG[0], 1, 4), // 1.400.000
  item(SEED_CATALOG[1], 0, 6), // 1.080.000
];
export const SEED_QUOTE_DISCOUNT = 180_000;
// subtotal 3.680.000 - descuento 180.000 = 3.500.000; IVA 665.000; total 4.165.000
export const SEED_QUOTE_TOTALS = computeQuoteTotals(SEED_QUOTE_ITEMS, SEED_QUOTE_DISCOUNT, true);

export const SEED_PROVIDER: Provider = {
  id: SEED.providerId, name: "Sonido Total SAS", contact: "Carlos Ruiz",
  phone: "3001234567", email: "ventas@sonidototal.test", categories: ["Audio"],
  createdAt: NOW, updatedAt: NOW,
};

export async function seed(): Promise<void> {
  await assertEmulatorsRunning();
  await clearEmulators();
  const db = testDb();
  const auth = testAuth();

  // ── Usuarios (Auth + custom claims + users/{uid}) ──────────────────────────
  const uids: Record<string, string> = {};
  for (const u of Object.values(USERS)) {
    const created = await auth.createUser({ email: u.email, password: u.password, displayName: u.displayName });
    await auth.setCustomUserClaims(created.uid, { role: u.role });
    uids[u.role] = created.uid;
    const doc: MagikUser = {
      uid: created.uid, email: u.email, displayName: u.displayName, role: u.role,
      active: true, createdAt: NOW, updatedAt: NOW,
    };
    await db.collection("users").doc(created.uid).set(doc);
  }
  const adminUid = uids.admin;

  const batch = db.batch();

  // ── Eventos EVT-0001..0003 ────────────────────────────────────────────────
  for (const e of SEED_EVENTS) {
    batch.set(db.collection("events").doc(e.id), { ...e, createdBy: adminUid });
  }

  // ── Cotización COT-001-2026 ───────────────────────────────────────────────
  const quote: Quote = {
    id: SEED.quoteId, eventId: SEED.events[0], consecutive: "COT-001-2026",
    title: "Cotización convención", version: 1, status: "draft",
    clientCompany: "Bancolombia S.A.", attention: "Laura Gómez", attentionRole: "Jefe de eventos",
    subject: "Producción técnica convención anual", paymentTerms: "50% anticipo - 50% contraentrega",
    hasIva: true, discount: SEED_QUOTE_DISCOUNT, items: SEED_QUOTE_ITEMS,
    subtotal: SEED_QUOTE_TOTALS.subtotal, total: SEED_QUOTE_TOTALS.total,
    createdBy: adminUid, createdAt: NOW, updatedAt: NOW,
  };
  batch.set(db.collection("events").doc(SEED.events[0]).collection("quotes").doc(quote.id), quote);

  // ── Orden OS-001-2026 ─────────────────────────────────────────────────────
  const order: ServiceOrder = {
    id: SEED.orderId, eventId: SEED.events[0], orderConsecutive: "OS-001-2026",
    providerId: SEED_PROVIDER.id, providerName: SEED_PROVIDER.name, razonSocial: SEED_PROVIDER.name,
    contactoProveedor: SEED_PROVIDER.contact, emailProveedor: SEED_PROVIDER.email,
    celularProveedor: SEED_PROVIDER.phone, title: "Audio convención",
    fechaMontaje: "2026-03-14", horaMontaje: "08:00", fechaEvento: "2026-03-15",
    items: [SEED_QUOTE_ITEMS[1]], anticipo: true, anticipoValor: 700_000, anticipoFecha: "2026-03-01",
    saldo: 700_000, fechaSaldo: "2026-03-20",
    createdBy: adminUid, createdAt: NOW, updatedAt: NOW,
  };
  batch.set(db.collection("events").doc(SEED.events[0]).collection("serviceOrders").doc(order.id), order);

  // ── Archivo de evento (Foto) ──────────────────────────────────────────────
  const file: EventFile = {
    id: SEED.fileId, eventId: SEED.events[0], name: "montaje-tarima.jpg", category: "Foto",
    storageUrl: "/assets/logoBlanco.png", mimeType: "image/png", sizeBytes: 2048,
    uploadedBy: adminUid, uploadedByName: USERS.admin.displayName, createdAt: NOW,
  };
  batch.set(db.collection("events").doc(SEED.events[0]).collection("files").doc(file.id), file);

  // ── Catálogo, proveedor, cliente ──────────────────────────────────────────
  batch.set(db.collection("catalog").doc("rubros"), { items: SEED_CATALOG });
  batch.set(db.collection("providers").doc(SEED_PROVIDER.id), SEED_PROVIDER);
  const client: Client = {
    id: SEED.clientId, name: "Bancolombia", company: "Bancolombia S.A.", phone: "6045100000",
    email: "eventos@bancolombia.test", eventIds: [SEED.events[0]], createdAt: NOW, updatedAt: NOW,
  };
  batch.set(db.collection("clients").doc(client.id), client);

  // ── Plantilla con v1 ──────────────────────────────────────────────────────
  const template: Template = {
    id: SEED.templateId, name: "Cotización estándar", type: "quote", activeVersion: 1,
    storageUrl: "https://storage.test/templates/cotizacion-v1.docx", createdAt: NOW, updatedAt: NOW,
  };
  const v1: TemplateVersion = {
    id: "tplv-0001", templateId: template.id, version: 1, storageUrl: template.storageUrl,
    changelog: "Versión inicial", publishedBy: adminUid, publishedByName: USERS.admin.displayName,
    publishedAt: NOW,
  };
  batch.set(db.collection("templates").doc(template.id), template);
  batch.set(db.collection("templates").doc(template.id).collection("versions").doc(v1.id), v1);

  // ── Portafolio: uno visible y uno oculto ──────────────────────────────────
  const visible: PortfolioItem = {
    id: SEED.portfolioVisible, eventId: SEED.events[0], eventName: "Convención anual Bancolombia",
    imageUrls: ["/assets/logoBlanco.png"], visible: true, order: 0, publishedAt: NOW,
  };
  const hidden: PortfolioItem = {
    id: SEED.portfolioHidden, eventId: SEED.events[1], eventName: "Evento oculto interno",
    imageUrls: ["/assets/logoBlanco.png"], visible: false, order: 1, publishedAt: NOW,
  };
  batch.set(db.collection("portfolio").doc(visible.id), visible);
  batch.set(db.collection("portfolio").doc(hidden.id), hidden);

  // ── Contadores de consecutivos ────────────────────────────────────────────
  batch.set(db.collection("counters").doc("events"), { count: 3 });
  batch.set(db.collection("counters").doc("quotes"), { count: 1 });
  batch.set(db.collection("counters").doc("serviceOrders"), { count: 1 });

  await batch.commit();
}

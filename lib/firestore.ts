import { adminDb } from "@/lib/firebase-admin";
import type {
  MagikUser,
  MagikEvent,
  Quote,
  ServiceOrder,
  CatalogRubro,
  CatalogProduct,
  Template,
  TemplateVersion,
  Provider,
  Client,
  PortfolioItem,
  FirestoreResult,
} from "@/lib/types";

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<FirestoreResult<MagikUser[]>> {
  try {
    const snap = await adminDb
      .collection("users")
      .orderBy("createdAt", "asc")
      .get();
    const data = snap.docs.map((doc) => doc.data() as MagikUser);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createUser(
  data: MagikUser
): Promise<FirestoreResult<void>> {
  try {
    await adminDb.collection("users").doc(data.uid).set(data);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateUser(
  uid: string,
  data: Partial<Omit<MagikUser, "uid" | "createdAt">>
): Promise<FirestoreResult<void>> {
  try {
    await adminDb
      .collection("users")
      .doc(uid)
      .update({ ...data, updatedAt: new Date().toISOString() });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteUser(uid: string): Promise<FirestoreResult<void>> {
  try {
    await adminDb.collection("users").doc(uid).delete();
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface EventFilters {
  clientName?: string;
  year?: number;
  eventType?: MagikEvent["eventType"];
  place?: string;
}

export async function getEvents(
  filters?: EventFilters
): Promise<FirestoreResult<MagikEvent[]>> {
  try {
    // Combining where() + orderBy() on different fields requires a composite
    // index. To avoid that, when filtering by eventType we sort in memory.
    let query: FirebaseFirestore.Query = filters?.eventType
      ? adminDb.collection("events").where("eventType", "==", filters.eventType)
      : adminDb.collection("events").orderBy("date", "desc");

    const snap = await query.get();
    let data = snap.docs.map((doc) => doc.data() as MagikEvent);

    if (filters?.eventType) {
      data.sort((a, b) => b.date.localeCompare(a.date));
    }

    if (filters?.clientName) {
      const q = filters.clientName.toLowerCase();
      data = data.filter((e) => e.clientName.toLowerCase().includes(q));
    }
    if (filters?.place) {
      const q = filters.place.toLowerCase();
      data = data.filter((e) => e.place.toLowerCase().includes(q));
    }
    if (filters?.year) {
      data = data.filter((e) => e.date.startsWith(String(filters.year)));
    }

    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getEvent(
  id: string
): Promise<FirestoreResult<MagikEvent | null>> {
  try {
    const doc = await adminDb.collection("events").doc(id).get();
    const data = doc.exists ? (doc.data() as MagikEvent) : null;
    return { success: true, data };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createEvent(
  data: Omit<MagikEvent, "id" | "consecutive" | "createdAt" | "updatedAt">
): Promise<FirestoreResult<MagikEvent>> {
  try {
    // Determine next consecutive number
    const lastSnap = await adminDb
      .collection("events")
      .orderBy("consecutive", "desc")
      .limit(1)
      .get();

    let nextNum = 1;
    if (!lastSnap.empty) {
      const last = lastSnap.docs[0].data() as MagikEvent;
      const match = last.consecutive.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const consecutive = `EVT-${String(nextNum).padStart(4, "0")}`;

    const ref = adminDb.collection("events").doc();
    const now = new Date().toISOString();
    const event: MagikEvent = {
      ...data,
      id: ref.id,
      consecutive,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(event);
    return { success: true, data: event };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<MagikEvent, "id" | "consecutive" | "createdAt">>
): Promise<FirestoreResult<MagikEvent>> {
  try {
    const now = new Date().toISOString();
    await adminDb
      .collection("events")
      .doc(id)
      .update({ ...data, updatedAt: now });
    const updated = await adminDb.collection("events").doc(id).get();
    return { success: true, data: updated.data() as MagikEvent };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteEvent(id: string): Promise<FirestoreResult<void>> {
  try {
    await adminDb.collection("events").doc(id).delete();
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

function quotesCol(eventId: string) {
  return adminDb.collection("events").doc(eventId).collection("quotes");
}

export async function getQuotes(
  eventId: string
): Promise<FirestoreResult<Quote[]>> {
  try {
    const snap = await quotesCol(eventId).orderBy("createdAt", "desc").get();
    return { success: true, data: snap.docs.map((d) => d.data() as Quote) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getQuote(
  eventId: string,
  quoteId: string
): Promise<FirestoreResult<Quote | null>> {
  try {
    const doc = await quotesCol(eventId).doc(quoteId).get();
    return { success: true, data: doc.exists ? (doc.data() as Quote) : null };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function generateQuoteConsecutive(): Promise<string> {
  const counterRef = adminDb.collection("counters").doc("quotes");
  const snap = await counterRef.get();
  const next = snap.exists ? ((snap.data() as { count: number }).count) + 1 : 1;
  await counterRef.set({ count: next });
  const year = new Date().getFullYear();
  return `COT-${String(next).padStart(3, "0")}-${year}`;
}

export async function createQuote(
  eventId: string,
  data: Omit<Quote, "id" | "consecutive" | "createdAt" | "updatedAt">
): Promise<FirestoreResult<Quote>> {
  try {
    const consecutive = await generateQuoteConsecutive();
    const ref = quotesCol(eventId).doc();
    const now = new Date().toISOString();
    const quote: Quote = { ...data, id: ref.id, consecutive, createdAt: now, updatedAt: now };
    await ref.set(quote);
    return { success: true, data: quote };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateQuote(
  eventId: string,
  quoteId: string,
  data: Partial<Omit<Quote, "id" | "eventId" | "createdAt" | "createdBy">>
): Promise<FirestoreResult<Quote>> {
  try {
    const now = new Date().toISOString();
    await quotesCol(eventId).doc(quoteId).update({ ...data, updatedAt: now });
    const updated = await quotesCol(eventId).doc(quoteId).get();
    return { success: true, data: updated.data() as Quote };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteQuote(
  eventId: string,
  quoteId: string
): Promise<FirestoreResult<void>> {
  try {
    await quotesCol(eventId).doc(quoteId).delete();
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function duplicateQuote(
  eventId: string,
  quoteId: string
): Promise<FirestoreResult<Quote>> {
  try {
    const result = await getQuote(eventId, quoteId);
    if (!result.success || !result.data) {
      return { success: false, error: "Cotización no encontrada" };
    }
    const { pdfUrl: _pdfUrl, ...rest } = result.data;
    const ref = quotesCol(eventId).doc();
    const now = new Date().toISOString();
    const copy: Quote = {
      ...rest,
      id: ref.id,
      title: `${rest.title} (copia)`,
      version: 1,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(copy);
    return { success: true, data: copy };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Service Orders ──────────────────────────────────────────────────────────

function ordersCol(eventId: string) {
  return adminDb.collection("events").doc(eventId).collection("serviceOrders");
}

export async function getServiceOrders(
  eventId: string
): Promise<FirestoreResult<ServiceOrder[]>> {
  try {
    const snap = await ordersCol(eventId).orderBy("createdAt", "desc").get();
    return { success: true, data: snap.docs.map((d) => d.data() as ServiceOrder) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getServiceOrder(
  eventId: string,
  orderId: string
): Promise<FirestoreResult<ServiceOrder | null>> {
  try {
    const doc = await ordersCol(eventId).doc(orderId).get();
    return { success: true, data: doc.exists ? (doc.data() as ServiceOrder) : null };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function generateOrderConsecutive(): Promise<string> {
  const counterRef = adminDb.collection("counters").doc("serviceOrders");
  const snap = await counterRef.get();
  const next = snap.exists ? ((snap.data() as { count: number }).count) + 1 : 1;
  await counterRef.set({ count: next });
  return `OS-${String(next).padStart(4, "0")}`;
}

export async function createServiceOrder(
  eventId: string,
  data: Omit<ServiceOrder, "id" | "orderConsecutive" | "createdAt" | "updatedAt">
): Promise<FirestoreResult<ServiceOrder>> {
  try {
    const orderConsecutive = await generateOrderConsecutive();
    const ref = ordersCol(eventId).doc();
    const now = new Date().toISOString();
    const order: ServiceOrder = { ...data, id: ref.id, orderConsecutive, createdAt: now, updatedAt: now };
    await ref.set(order);
    return { success: true, data: order };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateServiceOrder(
  eventId: string,
  orderId: string,
  data: Partial<Omit<ServiceOrder, "id" | "eventId" | "createdAt" | "createdBy">>
): Promise<FirestoreResult<ServiceOrder>> {
  try {
    const now = new Date().toISOString();
    await ordersCol(eventId).doc(orderId).update({ ...data, updatedAt: now });
    const updated = await ordersCol(eventId).doc(orderId).get();
    return { success: true, data: updated.data() as ServiceOrder };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteServiceOrder(
  eventId: string,
  orderId: string
): Promise<FirestoreResult<void>> {
  try {
    await ordersCol(eventId).doc(orderId).delete();
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

const CATALOG_DOC = () => adminDb.collection("catalog").doc("rubros");

export async function getCatalog(): Promise<FirestoreResult<CatalogRubro[]>> {
  try {
    const doc = await CATALOG_DOC().get();
    const items: CatalogRubro[] = doc.exists
      ? ((doc.data() as { items: CatalogRubro[] }).items ?? [])
      : [];
    return { success: true, data: items };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateCatalog(
  rubros: CatalogRubro[]
): Promise<FirestoreResult<void>> {
  try {
    await CATALOG_DOC().set({ items: rubros });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function addRubro(
  rubro: Omit<CatalogRubro, "id">
): Promise<FirestoreResult<CatalogRubro>> {
  try {
    const catalog = await getCatalog();
    if (!catalog.success) return catalog;
    const newRubro: CatalogRubro = { ...rubro, id: crypto.randomUUID() };
    await CATALOG_DOC().set({ items: [...catalog.data, newRubro] });
    return { success: true, data: newRubro };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateRubro(
  rubroId: string,
  data: Partial<Omit<CatalogRubro, "id" | "products">>
): Promise<FirestoreResult<void>> {
  try {
    const catalog = await getCatalog();
    if (!catalog.success) return catalog;
    const items = catalog.data.map((r) =>
      r.id === rubroId ? { ...r, ...data } : r
    );
    await CATALOG_DOC().set({ items });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteRubro(
  rubroId: string
): Promise<FirestoreResult<void>> {
  try {
    const catalog = await getCatalog();
    if (!catalog.success) return catalog;
    const items = catalog.data.filter((r) => r.id !== rubroId);
    await CATALOG_DOC().set({ items });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function addProduct(
  rubroId: string,
  product: Omit<CatalogProduct, "id">
): Promise<FirestoreResult<CatalogProduct>> {
  try {
    const catalog = await getCatalog();
    if (!catalog.success) return catalog;
    const newProduct: CatalogProduct = { ...product, id: crypto.randomUUID() };
    const items = catalog.data.map((r) =>
      r.id === rubroId
        ? { ...r, products: [...r.products, newProduct] }
        : r
    );
    await CATALOG_DOC().set({ items });
    return { success: true, data: newProduct };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateProduct(
  rubroId: string,
  productId: string,
  data: Partial<Omit<CatalogProduct, "id">>
): Promise<FirestoreResult<void>> {
  try {
    const catalog = await getCatalog();
    if (!catalog.success) return catalog;
    const items = catalog.data.map((r) =>
      r.id === rubroId
        ? {
            ...r,
            products: r.products.map((p) =>
              p.id === productId ? { ...p, ...data } : p
            ),
          }
        : r
    );
    await CATALOG_DOC().set({ items });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteProduct(
  rubroId: string,
  productId: string
): Promise<FirestoreResult<void>> {
  try {
    const catalog = await getCatalog();
    if (!catalog.success) return catalog;
    const items = catalog.data.map((r) =>
      r.id === rubroId
        ? { ...r, products: r.products.filter((p) => p.id !== productId) }
        : r
    );
    await CATALOG_DOC().set({ items });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<FirestoreResult<Template[]>> {
  try {
    const snap = await adminDb.collection("templates").orderBy("createdAt", "desc").get();
    return { success: true, data: snap.docs.map((d) => d.data() as Template) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getTemplate(
  id: string
): Promise<FirestoreResult<Template | null>> {
  try {
    const doc = await adminDb.collection("templates").doc(id).get();
    return { success: true, data: doc.exists ? (doc.data() as Template) : null };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getTemplateVersions(
  templateId: string
): Promise<FirestoreResult<TemplateVersion[]>> {
  try {
    const snap = await adminDb
      .collection("templates")
      .doc(templateId)
      .collection("versions")
      .orderBy("version", "desc")
      .get();
    return { success: true, data: snap.docs.map((d) => d.data() as TemplateVersion) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createTemplate(
  data: Omit<Template, "id" | "createdAt" | "updatedAt">
): Promise<FirestoreResult<Template>> {
  try {
    const ref = adminDb.collection("templates").doc();
    const now = new Date().toISOString();
    const template: Template = { ...data, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(template);
    return { success: true, data: template };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateTemplate(
  id: string,
  data: Partial<Omit<Template, "id" | "createdAt">>
): Promise<FirestoreResult<Template>> {
  try {
    const now = new Date().toISOString();
    await adminDb.collection("templates").doc(id).update({ ...data, updatedAt: now });
    const updated = await adminDb.collection("templates").doc(id).get();
    return { success: true, data: updated.data() as Template };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteTemplate(id: string): Promise<FirestoreResult<void>> {
  try {
    await adminDb.collection("templates").doc(id).delete();
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function publishTemplateVersion(
  templateId: string,
  data: Omit<TemplateVersion, "id" | "publishedAt">
): Promise<FirestoreResult<TemplateVersion>> {
  try {
    const ref = adminDb
      .collection("templates")
      .doc(templateId)
      .collection("versions")
      .doc();
    const now = new Date().toISOString();
    const version: TemplateVersion = { ...data, id: ref.id, publishedAt: now };
    await ref.set(version);
    await adminDb.collection("templates").doc(templateId).update({
      activeVersion: data.version,
      storageUrl: data.storageUrl,
      updatedAt: now,
    });
    return { success: true, data: version };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Providers ───────────────────────────────────────────────────────────────

export async function getProviders(): Promise<FirestoreResult<Provider[]>> {
  throw new Error("Not implemented");
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function getClients(): Promise<FirestoreResult<Client[]>> {
  throw new Error("Not implemented");
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPortfolioItems(): Promise<FirestoreResult<PortfolioItem[]>> {
  throw new Error("Not implemented");
}

// ─── Roles & Auth ────────────────────────────────────────────────────────────

export type UserRole = "admin" | "collaborator";

export interface MagikUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventType = "corporativo" | "entretenimiento" | "especial";

export interface MagikEvent {
  id: string;
  consecutive: string; // e.g. EVT-0001
  eventName?: string;
  clientName: string;
  eventType: EventType;
  place: string;
  date: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface CatalogProduct {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
}

export interface CatalogRubro {
  id: string;
  name: string;
  products: CatalogProduct[];
}

// ─── Documents ───────────────────────────────────────────────────────────────

export interface DocumentItem {
  rubroId: string;
  rubroName: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type QuoteStatus = "draft" | "published";

export interface Quote {
  id: string;
  eventId: string;
  consecutive?: string;
  title: string;
  version: number;
  status: QuoteStatus;
  // Destinatario
  clientCompany?: string;
  attention: string;
  attentionRole: string;
  subject: string;
  // Fechas
  assemblyDate?: string;
  assemblyTime?: string;
  testDate?: string;
  testTime?: string;
  // Condiciones
  paymentTerms?: string;
  hasIva?: boolean;
  discount?: number;
  // Items
  items: DocumentItem[];
  hasAddition?: boolean;
  additionItems?: DocumentItem[];
  // Totales
  subtotal: number;
  total: number;
  // Notas
  additionalNotes?: string;
  observations?: string;
  notes?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  eventId: string;
  orderConsecutive?: string;
  // Proveedor
  providerId: string;
  providerName: string;
  nitProveedor?: string;
  razonSocial?: string;
  contactoProveedor?: string;
  emailProveedor?: string;
  celularProveedor?: string;
  tipoServicio?: string;
  // Título / descripción
  title: string;
  // Fechas
  fechaMontaje?: string;
  horaMontaje?: string;
  fechaEvento?: string;
  horaEjecucion?: string;
  diaPrueba?: string;
  horaPrueba?: string;
  // Items
  items: DocumentItem[];
  // Forma de pago
  anticipo?: boolean;
  anticipoValor?: number;
  anticipoFecha?: string;
  credito?: boolean;
  creditoValor?: number;
  fechaPago?: string;
  abono2?: number;
  fechaAbono2?: string;
  saldo?: number;
  fechaSaldo?: string;
  // Notas
  observations?: string;
  notes?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Files ───────────────────────────────────────────────────────────────────

export type FileCategory =
  | "Foto"
  | "Contrato"
  | "Rider"
  | "Cotización"
  | "Orden de Servicio"
  | "Otro"
  | string;

export interface EventFile {
  id: string;
  eventId: string;
  name: string;
  category: FileCategory;
  storageUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export type TemplateType = "quote" | "serviceOrder";

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  activeVersion: number;
  storageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  storageUrl: string;
  changelog?: string;
  publishedBy: string;
  publishedAt: string;
}

// ─── Providers & Clients ─────────────────────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  categories: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  eventIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioItem {
  id: string;
  eventId: string;
  eventName: string;
  imageUrls: string[];
  visible: boolean;
  order: number;
  publishedAt: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export type FirestoreResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

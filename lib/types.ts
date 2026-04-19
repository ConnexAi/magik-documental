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
  title: string;
  version: number;
  status: QuoteStatus;
  items: DocumentItem[];
  subtotal: number;
  discount?: number;
  total: number;
  notes?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  eventId: string;
  providerId: string;
  providerName: string;
  title: string;
  items: DocumentItem[];
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

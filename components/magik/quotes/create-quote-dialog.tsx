"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, ChevronDown, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ItemSelector } from "@/components/magik/documents/item-selector";
import type { Quote, DocumentItem, CatalogRubro } from "@/lib/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, "El título es requerido"),
  attention: z.string().min(1, "Requerido"),
  attentionRole: z.string().min(1, "Requerido"),
  subject: z.string().min(1, "Requerido"),
  assemblyDate: z.string().optional(),
  assemblyTime: z.string().optional(),
  testDate: z.string().optional(),
  testTime: z.string().optional(),
  paymentTerms: z.string().optional(),
  hasIva: z.boolean().optional(),
  discount: z.string().optional(),
  additionalNotes: z.string().optional(),
  observations: z.string().optional(),
  hasAddition: z.boolean().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── FormSection ─────────────────────────────────────────────────────────────

function FormSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
        style={{ background: "var(--muted)" }}
      >
        <span className="section-label">{title}</span>
        <ChevronDown
          size={13}
          style={{
            color: "var(--color-text-muted)",
            transform: open ? undefined : "rotate(-90deg)",
            transition: "transform 150ms",
          }}
        />
      </button>
      {open && (
        <div
          className="space-y-3 px-3 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Items table ─────────────────────────────────────────────────────────────

interface ItemsTableProps {
  items: DocumentItem[];
  rubros: CatalogRubro[];
  onSelect: (p: {
    rubroId: string; rubroName: string;
    productId: string; productName: string;
    unit: string; unitPrice: number;
  }) => void;
  onUpdate: (idx: number, field: "quantity" | "unitPrice", val: string) => void;
  onRemove: (idx: number) => void;
  label: string;
}

function ItemsTable({ items, rubros, onSelect, onUpdate, onRemove, label }: ItemsTableProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <ItemSelector rubros={rubros} onSelect={onSelect} />
      </div>

      {items.length > 0 ? (
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                {["Producto", "Und", "Cant.", "P. Unit.", "Total", ""].map((h) => (
                  <th
                    key={h}
                    className={`px-3 py-2 ${h === "Cant." || h === "P. Unit." || h === "Total" ? "text-right" : "text-left"}`}
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={`${item.productId}-${idx}`}
                  style={{ borderTop: idx === 0 ? undefined : "1px solid var(--border)" }}
                >
                  <td className="px-3 py-2" style={{ color: "var(--color-text-primary)" }}>
                    <div>{item.productName}</div>
                    <div style={{ color: "var(--color-text-muted)" }}>{item.rubroName}</div>
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>{item.unit}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min={1} value={item.quantity}
                      onChange={(e) => onUpdate(idx, "quantity", e.target.value)}
                      className="w-14 rounded border px-1.5 py-1 text-right text-xs outline-none"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--color-text-primary)" }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min={0} value={item.unitPrice}
                      onChange={(e) => onUpdate(idx, "unitPrice", e.target.value)}
                      className="w-22 rounded border px-1.5 py-1 text-right text-xs outline-none"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--color-text-primary)" }}
                    />
                  </td>
                  <td className="px-3 py-2 text-right" style={{ color: "var(--color-text-secondary)" }}>
                    {money(item.total)}
                  </td>
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => onRemove(idx)} style={{ color: "var(--color-text-muted)" }}>
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Usa el botón para agregar ítems del catálogo
        </p>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  eventId: string;
  eventConsecutive: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (quote: Quote) => void;
}

export function CreateQuoteDialog({ eventId, open, onOpenChange, onCreated }: Props) {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [additionItems, setAdditionItems] = useState<DocumentItem[]>([]);
  const [rubros, setRubros] = useState<CatalogRubro[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentTerms: "100% - A Convenir",
      hasIva: false,
      hasAddition: false,
    },
  });

  const watchHasIva = watch("hasIva");
  const watchDiscount = watch("discount");
  const watchHasAddition = watch("hasAddition");

  useEffect(() => {
    if (open) {
      fetch("/api/catalog")
        .then((r) => r.json())
        .then((b) => setRubros(b.rubros ?? []));
    }
  }, [open]);

  function handleClose() {
    reset({ paymentTerms: "100% - A Convenir", hasIva: false, hasAddition: false });
    setItems([]);
    setAdditionItems([]);
    setServerError(null);
    onOpenChange(false);
  }

  function makeAddItem(setter: React.Dispatch<React.SetStateAction<DocumentItem[]>>) {
    return (product: {
      rubroId: string; rubroName: string;
      productId: string; productName: string;
      unit: string; unitPrice: number;
    }) => {
      setter((prev) => {
        const existing = prev.findIndex((i) => i.productId === product.productId);
        if (existing >= 0) {
          return prev.map((item, idx) =>
            idx === existing
              ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
              : item
          );
        }
        return [
          ...prev,
          {
            rubroId: product.rubroId, rubroName: product.rubroName,
            productId: product.productId, productName: product.productName,
            unit: product.unit, quantity: 1, unitPrice: product.unitPrice,
            total: product.unitPrice,
          },
        ];
      });
    };
  }

  function makeUpdateItem(setter: React.Dispatch<React.SetStateAction<DocumentItem[]>>) {
    return (idx: number, field: "quantity" | "unitPrice", raw: string) => {
      const val = parseFloat(raw) || 0;
      setter((prev) =>
        prev.map((item, i) => {
          if (i !== idx) return item;
          const quantity = field === "quantity" ? val : item.quantity;
          const unitPrice = field === "unitPrice" ? val : item.unitPrice;
          return { ...item, quantity, unitPrice, total: quantity * unitPrice };
        })
      );
    };
  }

  function makeRemoveItem(setter: React.Dispatch<React.SetStateAction<DocumentItem[]>>) {
    return (idx: number) => setter((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discountAmount = Number(watchDiscount || 0);
  const base = subtotal - discountAmount;
  const ivaAmount = watchHasIva ? base * 0.19 : 0;
  const total = base + ivaAmount;

  async function onSubmit(data: FormData) {
    setServerError(null);
    const payload = {
      title: data.title,
      attention: data.attention,
      attentionRole: data.attentionRole,
      subject: data.subject,
      assemblyDate: data.assemblyDate || undefined,
      assemblyTime: data.assemblyTime || undefined,
      testDate: data.testDate || undefined,
      testTime: data.testTime || undefined,
      paymentTerms: data.paymentTerms || undefined,
      hasIva: data.hasIva ?? false,
      discount: data.discount ? Number(data.discount) : undefined,
      hasAddition: data.hasAddition ?? false,
      additionItems: data.hasAddition ? additionItems : undefined,
      items,
      subtotal,
      total,
      additionalNotes: data.additionalNotes || undefined,
      observations: data.observations || undefined,
      notes: data.notes || undefined,
    };
    const res = await fetch(`/api/events/${eventId}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { quote?: Quote; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al crear la cotización");
      return;
    }
    if (body.quote) onCreated(body.quote);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva cotización</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto py-2 pr-1">

            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="q-title">Título</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input id="q-title" placeholder="Ej: Cotización técnica completa" {...field} />
                )}
              />
              {errors.title && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.title.message}</p>
              )}
            </div>

            {/* Destinatario */}
            <FormSection title="Destinatario">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="q-attention">Atención</Label>
                  <Controller
                    name="attention"
                    control={control}
                    render={({ field }) => (
                      <Input id="q-attention" placeholder="Nombre de la persona" {...field} />
                    )}
                  />
                  {errors.attention && (
                    <p className="text-xs" style={{ color: "#E53935" }}>{errors.attention.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-attentionRole">Cargo</Label>
                  <Controller
                    name="attentionRole"
                    control={control}
                    render={({ field }) => (
                      <Input id="q-attentionRole" placeholder="Cargo de la persona" {...field} />
                    )}
                  />
                  {errors.attentionRole && (
                    <p className="text-xs" style={{ color: "#E53935" }}>{errors.attentionRole.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-subject">Asunto</Label>
                <Controller
                  name="subject"
                  control={control}
                  render={({ field }) => (
                    <Input id="q-subject" placeholder="Asunto de la cotización" {...field} />
                  )}
                />
                {errors.subject && (
                  <p className="text-xs" style={{ color: "#E53935" }}>{errors.subject.message}</p>
                )}
              </div>
            </FormSection>

            {/* Fechas */}
            <FormSection title="Fechas" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="q-assemblyDate">Fecha de montaje</Label>
                  <Controller
                    name="assemblyDate"
                    control={control}
                    render={({ field }) => <Input id="q-assemblyDate" type="date" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-assemblyTime">Hora de montaje</Label>
                  <Controller
                    name="assemblyTime"
                    control={control}
                    render={({ field }) => <Input id="q-assemblyTime" type="time" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-testDate">Fecha de pruebas</Label>
                  <Controller
                    name="testDate"
                    control={control}
                    render={({ field }) => <Input id="q-testDate" type="date" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="q-testTime">Hora de pruebas</Label>
                  <Controller
                    name="testTime"
                    control={control}
                    render={({ field }) => <Input id="q-testTime" type="time" {...field} />}
                  />
                </div>
              </div>
            </FormSection>

            {/* Items */}
            <FormSection title="Ítems">
              <ItemsTable
                items={items}
                rubros={rubros}
                onSelect={makeAddItem(setItems)}
                onUpdate={makeUpdateItem(setItems)}
                onRemove={makeRemoveItem(setItems)}
                label="Productos"
              />
            </FormSection>

            {/* Adición sin costo */}
            <FormSection title="Adición sin costo" defaultOpen={false}>
              <Controller
                name="hasAddition"
                control={control}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Incluir sección de adición sin costo
                    </span>
                  </label>
                )}
              />
              {watchHasAddition && (
                <ItemsTable
                  items={additionItems}
                  rubros={rubros}
                  onSelect={makeAddItem(setAdditionItems)}
                  onUpdate={makeUpdateItem(setAdditionItems)}
                  onRemove={makeRemoveItem(setAdditionItems)}
                  label="Ítems de adición"
                />
              )}
            </FormSection>

            {/* Condiciones */}
            <FormSection title="Condiciones" defaultOpen={false}>
              <div className="space-y-1.5">
                <Label htmlFor="q-paymentTerms">Forma de pago</Label>
                <Controller
                  name="paymentTerms"
                  control={control}
                  render={({ field }) => (
                    <Input id="q-paymentTerms" placeholder="100% - A Convenir" {...field} />
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="q-discount">Descuento comercial</Label>
                  <Controller
                    name="discount"
                    control={control}
                    render={({ field }) => (
                      <Input id="q-discount" type="number" min={0} placeholder="0" {...field} />
                    )}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <Controller
                    name="hasIva"
                    control={control}
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.value ?? false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          Aplicar IVA (19%)
                        </span>
                      </label>
                    )}
                  />
                </div>
              </div>

              {/* Resumen de totales */}
              {items.length > 0 && (
                <div
                  className="space-y-1.5 rounded-lg border px-3 py-2.5"
                  style={{ borderColor: "var(--border)", background: "var(--muted)" }}
                >
                  <div className="flex justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <span>Subtotal</span><span>{money(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      <span>Descuento</span><span>- {money(discountAmount)}</span>
                    </div>
                  )}
                  {watchHasIva && (
                    <div className="flex justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      <span>IVA 19%</span><span>{money(ivaAmount)}</span>
                    </div>
                  )}
                  <div
                    className="flex justify-between text-sm font-medium"
                    style={{ borderTop: "1px solid var(--border)", color: "var(--color-text-primary)", paddingTop: 6 }}
                  >
                    <span>Total</span><span>{money(total)}</span>
                  </div>
                </div>
              )}
            </FormSection>

            {/* Notas */}
            <FormSection title="Notas y observaciones" defaultOpen={false}>
              <div className="space-y-1.5">
                <Label htmlFor="q-additionalNotes">Notas adicionales</Label>
                <Controller
                  name="additionalNotes"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="q-additionalNotes" placeholder="Notas para el cliente..." {...field} />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-observations">Observaciones</Label>
                <Controller
                  name="observations"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="q-observations" placeholder="Observaciones internas..." {...field} />
                  )}
                />
              </div>
            </FormSection>

          </div>

          {serverError && (
            <p
              className="mt-3 rounded-md border px-3 py-2 text-xs"
              style={{ background: "rgba(229,57,53,0.08)", borderColor: "rgba(229,57,53,0.3)", color: "#E53935" }}
            >
              {serverError}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="text-white" style={{ background: "var(--color-crimson)" }}>
              {isSubmitting ? "Creando..." : "Crear cotización"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

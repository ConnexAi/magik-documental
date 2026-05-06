"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
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
import { fetchWithAuth } from "@/lib/auth";
import type { ServiceOrder, DocumentItem, CatalogRubro, Provider } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "El título es requerido"),
  providerName: z.string().min(1, "El proveedor es requerido"),
  nitProveedor: z.string().optional(),
  razonSocial: z.string().optional(),
  contactoProveedor: z.string().optional(),
  emailProveedor: z.string().optional(),
  celularProveedor: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function money(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Props {
  eventId: string;
  order: ServiceOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (order: ServiceOrder) => void;
}

export function EditOrderDialog({ eventId, order, open, onOpenChange, onUpdated }: Props) {
  const [items, setItems] = useState<DocumentItem[]>(order.items);
  const [rubros, setRubros] = useState<CatalogRubro[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState(order.providerId);
  const [providerSearch, setProviderSearch] = useState(order.providerName);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const mouseOverSuggestions = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: order.title,
      providerName: order.providerName,
      nitProveedor: "",
      razonSocial: order.providerName,
      contactoProveedor: "",
      emailProveedor: "",
      celularProveedor: "",
      notes: order.notes ?? "",
    },
  });

  const suggestions = providerSearch.trim()
    ? providers.filter((p) => p.name.toLowerCase().includes(providerSearch.trim().toLowerCase()))
    : providers;

  function handleSelectProvider(p: Provider) {
    console.log("Provider seleccionado:", JSON.stringify(p, null, 2));
    setValue("providerName", p.name, { shouldDirty: true });
    setValue("nitProveedor", "", { shouldDirty: true });
    setValue("razonSocial", p.name, { shouldDirty: true });
    console.log("setValue contactoProveedor:", p.contact);
    setValue("contactoProveedor", p.contact ?? "", { shouldDirty: true });
    console.log("setValue emailProveedor:", p.email);
    setValue("emailProveedor", p.email ?? "", { shouldDirty: true });
    console.log("setValue celularProveedor:", p.phone);
    setValue("celularProveedor", p.phone ?? "", { shouldDirty: true });
    setSelectedProviderId(p.id);
    setProviderSearch(p.name);
    setShowSuggestions(false);
    mouseOverSuggestions.current = false;
    console.log("form values after:", getValues());
  }

  useEffect(() => {
    reset({
      title: order.title,
      providerName: order.providerName,
      nitProveedor: "",
      razonSocial: order.providerName,
      contactoProveedor: "",
      emailProveedor: "",
      celularProveedor: "",
      notes: order.notes ?? "",
    });
    setItems(order.items);
    setSelectedProviderId(order.providerId);
    setProviderSearch(order.providerName);
  }, [order, reset]);

  useEffect(() => {
    if (open) {
      fetch("/api/catalog")
        .then((r) => r.json())
        .then((b) => setRubros(b.rubros ?? []));
      fetchWithAuth("/api/providers")
        .then((r) => r.json())
        .then((b: { providers?: Provider[] }) => setProviders(b.providers ?? []));
    }
  }, [open]);

  function addItem(product: {
    rubroId: string; rubroName: string;
    productId: string; productName: string;
    unit: string; unitPrice: number;
  }) {
    const existing = items.findIndex((i) => i.productId === product.productId);
    if (existing >= 0) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existing
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        rubroId: product.rubroId, rubroName: product.rubroName,
        productId: product.productId, productName: product.productName,
        unit: product.unit, quantity: 1, unitPrice: product.unitPrice,
        total: product.unitPrice,
      },
    ]);
  }

  function updateItemField(idx: number, field: "quantity" | "unitPrice", raw: string) {
    const val = parseFloat(raw) || 0;
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const quantity = field === "quantity" ? val : item.quantity;
        const unitPrice = field === "unitPrice" ? val : item.unitPrice;
        return { ...item, quantity, unitPrice, total: quantity * unitPrice };
      })
    );
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((s, i) => s + i.total, 0);

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch(`/api/events/${eventId}/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        providerId: selectedProviderId,
        providerName: data.providerName,
        items,
        notes: data.notes || undefined,
      }),
    });
    const body = (await res.json()) as { order?: ServiceOrder; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al actualizar la orden");
      return;
    }
    if (body.order) onUpdated(body.order);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar orden de servicio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eo-title">Título</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => <Input id="eo-title" {...field} />}
              />
              {errors.title && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eo-provider">Proveedor</Label>
              <div style={{ position: "relative" }}>
                <input
                  id="eo-provider"
                  value={providerSearch}
                  placeholder="Buscar proveedor..."
                  autoComplete="off"
                  onChange={(e) => {
                    setProviderSearch(e.target.value);
                    setValue("providerName", e.target.value, { shouldDirty: true });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!mouseOverSuggestions.current) setShowSuggestions(false);
                    }, 150);
                  }}
                  style={{
                    width: "100%",
                    background: "var(--input)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    onMouseEnter={() => { mouseOverSuggestions.current = true; }}
                    onMouseLeave={() => { mouseOverSuggestions.current = false; }}
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      zIndex: 99999,
                      background: "#1E1E21",
                      border: "0.5px solid rgba(255,255,255,0.10)",
                      borderRadius: 7,
                      maxHeight: 200,
                      overflowY: "auto",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    {suggestions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProvider(p)}
                        style={{
                          padding: "8px 12px",
                          fontSize: 13,
                          cursor: "pointer",
                          color: "#F0EFF2",
                          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#252528"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        {p.contact && (
                          <span style={{ color: "#5A5860", marginLeft: 8, fontSize: 11 }}>
                            {p.contact}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.providerName && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.providerName.message}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <ItemSelector rubros={rubros} onSelect={addItem} />
            </div>

            {items.length > 0 && (
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                      <th className="px-3 py-2 text-left" style={{ color: "var(--color-text-muted)" }}>Producto</th>
                      <th className="px-3 py-2 text-left" style={{ color: "var(--color-text-muted)" }}>Und</th>
                      <th className="px-3 py-2 text-right" style={{ color: "var(--color-text-muted)" }}>Cant.</th>
                      <th className="px-3 py-2 text-right" style={{ color: "var(--color-text-muted)" }}>P. Unit.</th>
                      <th className="px-3 py-2 text-right" style={{ color: "var(--color-text-muted)" }}>Total</th>
                      <th className="px-2 py-2" />
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
                          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.rubroName}</div>
                        </td>
                        <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>{item.unit}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min={1} value={item.quantity}
                            onChange={(e) => updateItemField(idx, "quantity", e.target.value)}
                            className="w-16 rounded border px-1.5 py-1 text-right text-xs outline-none"
                            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--color-text-primary)" }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min={0} value={item.unitPrice}
                            onChange={(e) => updateItemField(idx, "unitPrice", e.target.value)}
                            className="w-24 rounded border px-1.5 py-1 text-right text-xs outline-none"
                            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--color-text-primary)" }}
                          />
                        </td>
                        <td className="px-3 py-2 text-right" style={{ color: "var(--color-text-secondary)" }}>
                          {money(item.total)}
                        </td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeItem(idx)} className="rounded p-0.5" style={{ color: "var(--color-text-muted)" }}>
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid var(--border)", background: "var(--muted)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Total</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{money(total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eo-notes">Notas (opcional)</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <Textarea id="eo-notes" {...field} />}
            />
          </div>

          {serverError && (
            <p className="rounded-md border px-3 py-2 text-xs" style={{ background: "rgba(229,57,53,0.08)", borderColor: "rgba(229,57,53,0.3)", color: "#E53935" }}>
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="text-white" style={{ background: "var(--color-crimson)" }}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

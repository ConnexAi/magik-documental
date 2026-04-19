"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemSelector } from "@/components/magik/documents/item-selector";
import type { Quote, DocumentItem, CatalogRubro } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "El título es requerido"),
  status: z.enum(["draft", "published"]),
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
  quote: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (quote: Quote) => void;
}

export function EditQuoteDialog({ eventId, quote, open, onOpenChange, onUpdated }: Props) {
  const [items, setItems] = useState<DocumentItem[]>(quote.items);
  const [rubros, setRubros] = useState<CatalogRubro[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: quote.title, status: quote.status, notes: quote.notes ?? "" },
  });

  useEffect(() => {
    reset({ title: quote.title, status: quote.status, notes: quote.notes ?? "" });
    setItems(quote.items);
  }, [quote, reset]);

  useEffect(() => {
    if (open) {
      fetch("/api/catalog")
        .then((r) => r.json())
        .then((b) => setRubros(b.rubros ?? []));
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

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch(`/api/events/${eventId}/quotes/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        status: data.status,
        items,
        subtotal,
        total: subtotal,
        notes: data.notes || undefined,
      }),
    });
    const body = (await res.json()) as { quote?: Quote; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al actualizar la cotización");
      return;
    }
    if (body.quote) onUpdated(body.quote);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar cotización · v{quote.version}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eq-title">Título</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => <Input id="eq-title" {...field} />}
              />
              {errors.title && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{field.value === "draft" ? "Borrador" : "Publicada"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="published">Publicada</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{money(subtotal)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eq-notes">Notas (opcional)</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => <Textarea id="eq-notes" {...field} />}
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

"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, ChevronDown } from "lucide-react";
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

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, "El título es requerido"),
  providerName: z.string().min(1, "El proveedor es requerido"),
  // Proveedor
  nitProveedor: z.string().optional(),
  razonSocial: z.string().optional(),
  contactoProveedor: z.string().optional(),
  emailProveedor: z.string().optional(),
  celularProveedor: z.string().optional(),
  tipoServicio: z.string().optional(),
  // Fechas
  fechaMontaje: z.string().optional(),
  horaMontaje: z.string().optional(),
  fechaEvento: z.string().optional(),
  horaEjecucion: z.string().optional(),
  diaPrueba: z.string().optional(),
  horaPrueba: z.string().optional(),
  // Forma de pago
  anticipo: z.boolean().optional(),
  anticipoValor: z.string().optional(),
  anticipoFecha: z.string().optional(),
  credito: z.boolean().optional(),
  creditoValor: z.string().optional(),
  fechaPago: z.string().optional(),
  abono2: z.string().optional(),
  fechaAbono2: z.string().optional(),
  saldo: z.string().optional(),
  fechaSaldo: z.string().optional(),
  // Observaciones
  observations: z.string().optional(),
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

function optNum(val: string | undefined): number | undefined {
  if (!val || val.trim() === "") return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
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

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  eventId: string;
  eventConsecutive: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (order: ServiceOrder) => void;
}

export function CreateOrderDialog({ eventId, open, onOpenChange, onCreated }: Props) {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [rubros, setRubros] = useState<CatalogRubro[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const mouseOverSuggestions = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      providerName: "",
      nitProveedor: "",
      razonSocial: "",
      contactoProveedor: "",
      emailProveedor: "",
      celularProveedor: "",
      tipoServicio: "",
      fechaMontaje: "",
      horaMontaje: "",
      fechaEvento: "",
      horaEjecucion: "",
      diaPrueba: "",
      horaPrueba: "",
      anticipo: false,
      anticipoValor: "",
      anticipoFecha: "",
      credito: false,
      creditoValor: "",
      fechaPago: "",
      abono2: "",
      fechaAbono2: "",
      saldo: "",
      fechaSaldo: "",
      observations: "",
      notes: "",
    },
  });

  const watchAnticipo = watch("anticipo");
  const watchCredito = watch("credito");

  const suggestions = providerSearch.trim()
    ? providers.filter((p) => p.name.toLowerCase().includes(providerSearch.trim().toLowerCase()))
    : providers;

  // Provider type: { id, name, contact?, phone?, email?, categories, notes?, createdAt, updatedAt }
  // nitProveedor y razonSocial NO existen en Provider — se usan "" y p.name respectivamente
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
    if (open) {
      fetch("/api/catalog")
        .then((r) => r.json())
        .then((b) => setRubros(b.rubros ?? []));
      fetchWithAuth("/api/providers")
        .then((r) => r.json())
        .then((b: { providers?: Provider[] }) => setProviders(b.providers ?? []));
    }
  }, [open]);

  function handleClose() {
    reset({
      title: "",
      providerName: "",
      nitProveedor: "",
      razonSocial: "",
      contactoProveedor: "",
      emailProveedor: "",
      celularProveedor: "",
      tipoServicio: "",
      fechaMontaje: "",
      horaMontaje: "",
      fechaEvento: "",
      horaEjecucion: "",
      diaPrueba: "",
      horaPrueba: "",
      anticipo: false,
      anticipoValor: "",
      anticipoFecha: "",
      credito: false,
      creditoValor: "",
      fechaPago: "",
      abono2: "",
      fechaAbono2: "",
      saldo: "",
      fechaSaldo: "",
      observations: "",
      notes: "",
    });
    setItems([]);
    setSelectedProviderId("");
    setProviderSearch("");
    setShowSuggestions(false);
    setServerError(null);
    onOpenChange(false);
  }

  function addItem(product: {
    rubroId: string; rubroName: string;
    productId: string; productName: string;
    unit: string; unitPrice: number;
  }) {
    setItems((prev) => {
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
  }

  function updateItem(idx: number, field: "quantity" | "unitPrice", raw: string) {
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

  const total = items.reduce((s, i) => s + i.total, 0);

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch(`/api/events/${eventId}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        providerId: selectedProviderId,
        providerName: data.providerName,
        nitProveedor: data.nitProveedor || undefined,
        razonSocial: data.razonSocial || undefined,
        contactoProveedor: data.contactoProveedor || undefined,
        emailProveedor: data.emailProveedor || undefined,
        celularProveedor: data.celularProveedor || undefined,
        tipoServicio: data.tipoServicio || undefined,
        fechaMontaje: data.fechaMontaje || undefined,
        horaMontaje: data.horaMontaje || undefined,
        fechaEvento: data.fechaEvento || undefined,
        horaEjecucion: data.horaEjecucion || undefined,
        diaPrueba: data.diaPrueba || undefined,
        horaPrueba: data.horaPrueba || undefined,
        anticipo: data.anticipo ?? false,
        anticipoValor: optNum(data.anticipoValor),
        anticipoFecha: data.anticipoFecha || undefined,
        credito: data.credito ?? false,
        creditoValor: optNum(data.creditoValor),
        fechaPago: data.fechaPago || undefined,
        abono2: optNum(data.abono2),
        fechaAbono2: data.fechaAbono2 || undefined,
        saldo: optNum(data.saldo),
        fechaSaldo: data.fechaSaldo || undefined,
        observations: data.observations || undefined,
        notes: data.notes || undefined,
        items,
      }),
    });
    const body = (await res.json()) as { order?: ServiceOrder; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al crear la orden");
      return;
    }
    if (body.order) onCreated(body.order);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }} modal={false}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva orden de servicio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto py-2 pr-1">

            {/* Título */}
            <div className="space-y-1.5">
              <Label htmlFor="o-title">Título</Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input id="o-title" placeholder="Ej: Orden de audio" {...field} />
                )}
              />
              {errors.title && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.title.message}</p>
              )}
            </div>

            {/* Proveedor */}
            <FormSection title="Proveedor">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="o-providerName">Nombre del proveedor</Label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="o-providerName"
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
                <div className="space-y-1.5">
                  <Label htmlFor="o-razonSocial">Razón social</Label>
                  <Controller
                    name="razonSocial"
                    control={control}
                    render={({ field }) => (
                      <Input id="o-razonSocial" placeholder="Razón social" {...field} />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-nit">NIT</Label>
                  <Controller
                    name="nitProveedor"
                    control={control}
                    render={({ field }) => (
                      <Input id="o-nit" placeholder="000.000.000-0" {...field} />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-contacto">Contacto</Label>
                  <Controller
                    name="contactoProveedor"
                    control={control}
                    render={({ field }) => (
                      <Input id="o-contacto" placeholder="Nombre del contacto" {...field} />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-email">Email</Label>
                  <Controller
                    name="emailProveedor"
                    control={control}
                    render={({ field }) => (
                      <Input id="o-email" type="email" placeholder="correo@proveedor.com" {...field} />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-celular">Celular</Label>
                  <Controller
                    name="celularProveedor"
                    control={control}
                    render={({ field }) => (
                      <Input id="o-celular" placeholder="300 000 0000" {...field} />
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="o-tipoServicio">Tipo de servicio</Label>
                <Controller
                  name="tipoServicio"
                  control={control}
                  render={({ field }) => (
                    <Input id="o-tipoServicio" placeholder="Audio, iluminación, tarimas..." {...field} />
                  )}
                />
              </div>
            </FormSection>

            {/* Fechas y Horas */}
            <FormSection title="Fechas y Horas" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="o-fechaMontaje">Fecha de montaje</Label>
                  <Controller
                    name="fechaMontaje"
                    control={control}
                    render={({ field }) => <Input id="o-fechaMontaje" type="date" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-horaMontaje">Hora de montaje</Label>
                  <Controller
                    name="horaMontaje"
                    control={control}
                    render={({ field }) => <Input id="o-horaMontaje" type="time" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-fechaEvento">Fecha del evento</Label>
                  <Controller
                    name="fechaEvento"
                    control={control}
                    render={({ field }) => <Input id="o-fechaEvento" type="date" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-horaEjecucion">Hora de ejecución</Label>
                  <Controller
                    name="horaEjecucion"
                    control={control}
                    render={({ field }) => <Input id="o-horaEjecucion" type="time" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-diaPrueba">Día de prueba</Label>
                  <Controller
                    name="diaPrueba"
                    control={control}
                    render={({ field }) => <Input id="o-diaPrueba" type="date" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-horaPrueba">Hora de prueba</Label>
                  <Controller
                    name="horaPrueba"
                    control={control}
                    render={({ field }) => <Input id="o-horaPrueba" type="time" {...field} />}
                  />
                </div>
              </div>
            </FormSection>

            {/* Ítems */}
            <FormSection title="Ítems">
              <div className="flex items-center justify-between">
                <Label>Productos</Label>
                <ItemSelector rubros={rubros} onSelect={addItem} />
              </div>

              {items.length > 0 ? (
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}>
                        {["Producto", "Und", "Cant.", "P. Unit.", "Total", ""].map((h) => (
                          <th
                            key={h}
                            className={`px-3 py-2 ${["Cant.", "P. Unit.", "Total"].includes(h) ? "text-right" : "text-left"}`}
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
                              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                              className="w-14 rounded border px-1.5 py-1 text-right text-xs outline-none"
                              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--color-text-primary)" }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number" min={0} value={item.unitPrice}
                              onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                              className="w-22 rounded border px-1.5 py-1 text-right text-xs outline-none"
                              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--color-text-primary)" }}
                            />
                          </td>
                          <td className="px-3 py-2 text-right" style={{ color: "var(--color-text-secondary)" }}>
                            {money(item.total)}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              <X size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderTop: "1px solid var(--border)", background: "var(--muted)" }}
                  >
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Total</span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{money(total)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Usa el botón para agregar ítems del catálogo
                </p>
              )}
            </FormSection>

            {/* Forma de Pago */}
            <FormSection title="Forma de Pago" defaultOpen={false}>
              {/* Anticipo */}
              <Controller
                name="anticipo"
                control={control}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      Anticipo
                    </span>
                  </label>
                )}
              />
              {watchAnticipo && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="o-anticipoValor">Valor anticipo</Label>
                    <Controller
                      name="anticipoValor"
                      control={control}
                      render={({ field }) => (
                        <Input id="o-anticipoValor" type="number" min={0} placeholder="0" {...field} />
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-anticipoFecha">Fecha anticipo</Label>
                    <Controller
                      name="anticipoFecha"
                      control={control}
                      render={({ field }) => <Input id="o-anticipoFecha" type="date" {...field} />}
                    />
                  </div>
                </div>
              )}

              {/* Crédito */}
              <Controller
                name="credito"
                control={control}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      Crédito
                    </span>
                  </label>
                )}
              />
              {watchCredito && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="o-creditoValor">Valor crédito</Label>
                    <Controller
                      name="creditoValor"
                      control={control}
                      render={({ field }) => (
                        <Input id="o-creditoValor" type="number" min={0} placeholder="0" {...field} />
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="o-fechaPago">Fecha de pago</Label>
                    <Controller
                      name="fechaPago"
                      control={control}
                      render={({ field }) => <Input id="o-fechaPago" type="date" {...field} />}
                    />
                  </div>
                </div>
              )}

              {/* Abono 2 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="o-abono2">Abono 2</Label>
                  <Controller
                    name="abono2"
                    control={control}
                    render={({ field }) => (
                      <Input id="o-abono2" type="number" min={0} placeholder="0" {...field} />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-fechaAbono2">Fecha abono 2</Label>
                  <Controller
                    name="fechaAbono2"
                    control={control}
                    render={({ field }) => <Input id="o-fechaAbono2" type="date" {...field} />}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-saldo">Saldo</Label>
                  <Controller
                    name="saldo"
                    control={control}
                    render={({ field }) => (
                      <Input id="o-saldo" type="number" min={0} placeholder="0" {...field} />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="o-fechaSaldo">Fecha saldo</Label>
                  <Controller
                    name="fechaSaldo"
                    control={control}
                    render={({ field }) => <Input id="o-fechaSaldo" type="date" {...field} />}
                  />
                </div>
              </div>
            </FormSection>

            {/* Observaciones */}
            <FormSection title="Observaciones" defaultOpen={false}>
              <div className="space-y-1.5">
                <Label htmlFor="o-observations">Observaciones</Label>
                <Controller
                  name="observations"
                  control={control}
                  render={({ field }) => (
                    <Textarea id="o-observations" placeholder="Observaciones para el proveedor..." {...field} />
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
              {isSubmitting ? "Creando..." : "Crear orden"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

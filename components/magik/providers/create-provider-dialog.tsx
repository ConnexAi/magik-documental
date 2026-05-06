"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { fetchWithAuth } from "@/lib/auth";
import type { Provider } from "@/lib/types";

const RUBROS = ["Audio", "Iluminación", "Tarimas", "Carpas", "Mobiliario", "Video", "Pantallas LED"];

interface FormValues {
  name: string;
  contact: string;
  phone: string;
  email: string;
  notes: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (p: Provider) => void;
}

export function CreateProviderDialog({ open, onOpenChange, onCreated }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: "", contact: "", phone: "", email: "", notes: "" } });

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleClose() {
    reset();
    setSelectedCategories([]);
    setError("");
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setError("");
    const body: Omit<Provider, "id" | "createdAt" | "updatedAt"> = {
      name: values.name,
      categories: selectedCategories,
      ...(values.contact && { contact: values.contact }),
      ...(values.phone && { phone: values.phone }),
      ...(values.email && { email: values.email }),
      ...(values.notes && { notes: values.notes }),
    };
    const res = await fetchWithAuth("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Error al crear el proveedor");
      return;
    }
    const { provider } = (await res.json()) as { provider: Provider };
    onCreated(provider);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "El nombre es requerido" }}
              render={({ field }) => <Input {...field} placeholder="Nombre del proveedor" />}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: "var(--color-crimson)" }}>{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Controller
                name="contact"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Nombre del contacto" />}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Celular</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input {...field} placeholder="310 000 0000" />}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => <Input {...field} type="email" placeholder="proveedor@email.com" />}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Categorías</Label>
            <div className="flex flex-wrap gap-2">
              {RUBROS.map((rubro) => (
                <button
                  key={rubro}
                  type="button"
                  onClick={() => toggleCategory(rubro)}
                  className="rounded px-3 py-1 text-xs font-medium transition-colors"
                  style={
                    selectedCategories.includes(rubro)
                      ? { background: "var(--color-crimson)", color: "#fff" }
                      : { background: "var(--bg-elevated)", color: "var(--color-text-muted)", border: "1px solid var(--border)" }
                  }
                >
                  {rubro}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={2}
                  placeholder="Observaciones adicionales"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{
                    background: "var(--input)",
                    borderColor: "var(--border)",
                    color: "var(--color-text-primary)",
                    resize: "none",
                    outline: "none",
                  }}
                />
              )}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--color-crimson)" }}>{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              {isSubmitting ? "Guardando..." : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

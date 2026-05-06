"use client";

import { useState, useEffect } from "react";
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
  provider: Provider;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: (p: Provider) => void;
}

export function EditProviderDialog({ provider, open, onOpenChange, onUpdated }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(provider.categories);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: provider.name,
      contact: provider.contact ?? "",
      phone: provider.phone ?? "",
      email: provider.email ?? "",
      notes: provider.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: provider.name,
        contact: provider.contact ?? "",
        phone: provider.phone ?? "",
        email: provider.email ?? "",
        notes: provider.notes ?? "",
      });
      setSelectedCategories(provider.categories);
      setError("");
    }
  }, [open, provider, reset]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function onSubmit(values: FormValues) {
    setError("");
    const body: Partial<Omit<Provider, "id" | "createdAt">> = {
      name: values.name,
      categories: selectedCategories,
      contact: values.contact || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      notes: values.notes || undefined,
    };
    const res = await fetchWithAuth(`/api/providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Error al actualizar el proveedor");
      return;
    }
    const { provider: updated } = (await res.json()) as { provider: Provider };
    onUpdated(updated);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
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
import type { CatalogRubro } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onCreated: (rubro: CatalogRubro) => void;
}

export function CreateRubroDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch("/api/catalog/rubros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, products: [] }),
    });
    const body = (await res.json()) as { rubro?: CatalogRubro; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al crear el rubro");
      return;
    }
    if (body.rubro) onCreated(body.rubro);
    reset();
    setOpen(false);
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="text-white"
        style={{ background: "var(--color-crimson)" }}
      >
        <Plus size={14} className="mr-1.5" />
        Nuevo rubro
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo rubro</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="rubro-name">Nombre del rubro</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="rubro-name"
                    placeholder="Ej: Audio, Iluminación..."
                    {...field}
                  />
                )}
              />
              {errors.name && (
                <p className="text-xs" style={{ color: "#E53935" }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            {serverError && (
              <p
                className="rounded-md border px-3 py-2 text-xs"
                style={{
                  background: "rgba(229, 57, 53, 0.08)",
                  borderColor: "rgba(229, 57, 53, 0.3)",
                  color: "#E53935",
                }}
              >
                {serverError}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-white"
                style={{ background: "var(--color-crimson)" }}
              >
                {isSubmitting ? "Creando..." : "Crear rubro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

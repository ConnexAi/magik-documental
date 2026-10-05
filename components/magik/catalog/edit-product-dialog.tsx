"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchWithAuth } from "@/lib/auth";
import type { CatalogProduct } from "@/lib/types";

const UNITS = ["und", "dia", "hora", "mt", "ml", "m2"];

// La unidad es texto libre aquí: productos antiguos pueden tener unidades
// fuera de UNITS y deben poder editarse sin perderla.
const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  unit: z.string().min(1, "Seleccione una unidad"),
  defaultPrice: z
    .string()
    .min(1, "Ingrese un precio")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      "El precio debe ser 0 o mayor"
    ),
});

type FormData = z.infer<typeof schema>;

interface Props {
  rubroId: string;
  product: CatalogProduct;
  onUpdated: (product: CatalogProduct) => void;
}

export function EditProductDialog({ rubroId, product, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const units = UNITS.includes(product.unit) ? UNITS : [product.unit, ...UNITS];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product.name,
      unit: product.unit,
      defaultPrice: String(product.defaultPrice),
    },
  });

  function openDialog() {
    reset({ name: product.name, unit: product.unit, defaultPrice: String(product.defaultPrice) });
    setServerError(null);
    setOpen(true);
  }

  async function onSubmit(data: FormData) {
    setServerError(null);
    const changes = { name: data.name.trim(), unit: data.unit, defaultPrice: Number(data.defaultPrice) };
    const res = await fetchWithAuth(`/api/catalog/rubros/${rubroId}/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setServerError(body.error ?? "Error al actualizar el producto");
      return;
    }
    onUpdated({ ...product, ...changes });
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="rounded p-1 transition-colors"
        style={{ color: "var(--color-text-muted)" }}
        title="Editar producto"
      >
        <Pencil size={13} />
      </button>

      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="edit-product-name">Nombre del producto</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input id="edit-product-name" {...field} />
                )}
              />
              {errors.name && (
                <p className="text-xs" style={{ color: "#E53935" }}>
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{field.value}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-product-price">Precio por defecto</Label>
                <Controller
                  name="defaultPrice"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="edit-product-price"
                      type="number"
                      min={0}
                      {...field}
                    />
                  )}
                />
                {errors.defaultPrice && (
                  <p className="text-xs" style={{ color: "#E53935" }}>
                    {errors.defaultPrice.message}
                  </p>
                )}
              </div>
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
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

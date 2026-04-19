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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CatalogProduct } from "@/lib/types";

const UNITS = ["und", "dia", "hora", "mt", "ml", "m2"] as const;

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  unit: z.enum(UNITS),
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
  onCreated: (product: CatalogProduct) => void;
}

export function CreateProductDialog({ rubroId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", unit: "und", defaultPrice: "" },
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch(`/api/catalog/rubros/${rubroId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, defaultPrice: Number(data.defaultPrice) }),
    });
    const body = (await res.json()) as {
      product?: CatalogProduct;
      error?: string;
    };
    if (!res.ok) {
      setServerError(body.error ?? "Error al crear el producto");
      return;
    }
    if (body.product) onCreated(body.product);
    reset();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Plus size={13} />
        Agregar producto
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="product-name">Nombre del producto</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="product-name"
                    placeholder="Ej: Cabina JBL 15&quot;"
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
                        {UNITS.map((u) => (
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
                <Label htmlFor="product-price">Precio por defecto</Label>
                <Controller
                  name="defaultPrice"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="product-price"
                      type="number"
                      min={0}
                      placeholder="0"
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
                {isSubmitting ? "Guardando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

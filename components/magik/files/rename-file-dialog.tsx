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
import { NativeSelect } from "@/components/magik/ui/native-select";
import { fetchWithAuth } from "@/lib/auth";
import type { EventFile } from "@/lib/types";

const STANDARD_CATEGORIES = ["Foto", "Contrato", "Rider", "Cotización", "Orden de Servicio", "Otro"];

const CATEGORY_OPTIONS = [
  { value: "Foto", label: "Foto" },
  { value: "Contrato", label: "Contrato" },
  { value: "Rider", label: "Rider" },
  { value: "Cotización", label: "Cotización" },
  { value: "Orden de Servicio", label: "Orden de Servicio" },
  { value: "Otro", label: "Otro" },
  { value: "Personalizada", label: "Personalizada..." },
];

interface FormValues {
  name: string;
  category: string;
}

interface Props {
  eventId: string;
  file: EventFile;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRenamed: (f: EventFile) => void;
}

function resolveSelectValue(category: string): string {
  return STANDARD_CATEGORIES.includes(category) ? category : "Personalizada";
}

export function RenameFileDialog({ eventId, file, open, onOpenChange, onRenamed }: Props) {
  const [isCustomCategory, setIsCustomCategory] = useState(!STANDARD_CATEGORIES.includes(file.category));
  const [selectValue, setSelectValue] = useState(resolveSelectValue(file.category));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: file.name, category: file.category } });

  useEffect(() => {
    if (open) {
      const isCustom = !STANDARD_CATEGORIES.includes(file.category);
      setIsCustomCategory(isCustom);
      setSelectValue(resolveSelectValue(file.category));
      reset({ name: file.name, category: file.category });
    }
  }, [open, file.name, file.category, reset]);

  async function onSubmit(values: FormValues) {
    const res = await fetchWithAuth(
      `/api/events/${eventId}/files/${file.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, category: values.category }),
      }
    );
    if (res.ok) {
      const { file: updated } = (await res.json()) as { file: EventFile };
      onRenamed(updated);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar archivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "El nombre es requerido" }}
              render={({ field }) => <Input {...field} />}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: "var(--color-crimson)" }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <>
                  <NativeSelect
                    value={selectValue}
                    placeholder="Seleccionar categoría"
                    options={CATEGORY_OPTIONS}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectValue(val);
                      if (val === "Personalizada") {
                        setIsCustomCategory(true);
                        field.onChange("");
                      } else {
                        setIsCustomCategory(false);
                        field.onChange(val);
                      }
                    }}
                  />
                  {isCustomCategory && (
                    <Input
                      className="mt-2"
                      placeholder="Escribir categoría"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                </>
              )}
            />
          </div>

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
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

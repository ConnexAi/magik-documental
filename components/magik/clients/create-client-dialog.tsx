"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Client } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: Client) => void;
}

export function CreateClientDialog({ open, onOpenChange, onCreated }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", company: "", phone: "", email: "" },
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetchWithAuth("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, eventIds: [] }),
    });
    const body = (await res.json()) as { client?: Client; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al crear el cliente");
      return;
    }
    if (body.client) onCreated(body.client);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Nombre</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input id="c-name" placeholder="Nombre completo o razón social" {...field} />
              )}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: "#E53935" }}>{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-company">Empresa</Label>
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <Input id="c-company" placeholder="Empresa u organización (opcional)" {...field} />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Teléfono</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input id="c-phone" placeholder="+57..." {...field} />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input id="c-email" type="email" placeholder="correo@..." {...field} />
                )}
              />
              {errors.email && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.email.message}</p>
              )}
            </div>
          </div>

          {serverError && (
            <p
              className="rounded-md border px-3 py-2 text-xs"
              style={{
                background: "rgba(229,57,53,0.08)",
                borderColor: "rgba(229,57,53,0.3)",
                color: "#E53935",
              }}
            >
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              {isSubmitting ? "Guardando..." : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

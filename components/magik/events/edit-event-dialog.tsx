"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MagikEvent } from "@/lib/types";

const schema = z.object({
  clientName: z.string().min(1, "El cliente es requerido"),
  eventType: z.enum(["corporativo", "entretenimiento", "especial"]),
  place: z.string().min(1, "El lugar es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const EVENT_TYPE_LABELS = {
  corporativo: "Corporativo",
  entretenimiento: "Entretenimiento",
  especial: "Especial",
};

interface Props {
  event: MagikEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (event: MagikEvent) => void;
}

export function EditEventDialog({ event, open, onOpenChange, onUpdated }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: event.clientName,
      eventType: event.eventType,
      place: event.place,
      date: event.date,
      description: event.description ?? "",
    },
  });

  // Re-populate when event changes
  useEffect(() => {
    reset({
      clientName: event.clientName,
      eventType: event.eventType,
      place: event.place,
      date: event.date,
      description: event.description ?? "",
    });
  }, [event, reset]);

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = (await res.json()) as { event?: MagikEvent; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al actualizar el evento");
      return;
    }
    if (body.event) onUpdated(body.event);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar evento · {event.consecutive}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-clientName">Cliente</Label>
            <Controller
              name="clientName"
              control={control}
              render={({ field }) => (
                <Input id="edit-clientName" placeholder="Nombre del cliente" {...field} />
              )}
            />
            {errors.clientName && (
              <p className="text-xs" style={{ color: "#E53935" }}>{errors.clientName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de evento</Label>
              <Controller
                name="eventType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{EVENT_TYPE_LABELS[field.value]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                      <SelectItem value="entretenimiento">Entretenimiento</SelectItem>
                      <SelectItem value="especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Fecha</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Input id="edit-date" type="date" {...field} />
                )}
              />
              {errors.date && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-place">Lugar</Label>
            <Controller
              name="place"
              control={control}
              render={({ field }) => (
                <Input id="edit-place" placeholder="Ciudad, venue..." {...field} />
              )}
            />
            {errors.place && (
              <p className="text-xs" style={{ color: "#E53935" }}>{errors.place.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Descripción (opcional)</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea id="edit-description" placeholder="Notas adicionales..." {...field} />
              )}
            />
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
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
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

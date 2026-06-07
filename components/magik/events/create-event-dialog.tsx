"use client";

import { useState, useRef, useEffect } from "react";
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
import type { MagikEvent, Client } from "@/lib/types";

const schema = z.object({
  eventName: z.string().optional(),
  clientName: z.string().min(1, "El cliente es requerido"),
  eventType: z.string().min(1, "El tipo de evento es requerido"),
  place: z.string().min(1, "El lugar es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const EVENT_TYPE_LABELS: { [key: string]: string } = {
  corporativo: "Corporativo",
  entretenimiento: "Entretenimiento",
  especial: "Especial",
  otro: "Otro",
};

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated: (event: MagikEvent) => void;
}

export function CreateEventDialog({ open: controlledOpen, onOpenChange, onCreated }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [serverError, setServerError] = useState<string | null>(null);
  const [typeSelectValue, setTypeSelectValue] = useState("corporativo");
  const [customType, setCustomType] = useState("");

  // Client autocomplete
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mouseOverSuggestions = useRef(false);

  const suggestions = clientSearch.trim().length > 0
    ? allClients.filter((c) =>
        c.name.toLowerCase().includes(clientSearch.trim().toLowerCase()) ||
        (c.company ?? "").toLowerCase().includes(clientSearch.trim().toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    if (open && allClients.length === 0) {
      fetch("/api/clients")
        .then((r) => r.json())
        .then((b: { clients?: Client[] }) => setAllClients(b.clients ?? []));
    }
  }, [open, allClients.length]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventName: "",
      clientName: "",
      eventType: "corporativo",
      place: "",
      date: "",
      description: "",
    },
  });

  function handleSelectClient(c: Client) {
    setClientSearch(c.name);
    setValue("clientName", c.name, { shouldDirty: true });
    setSelectedClientId(c.id);
    setShowSuggestions(false);
    mouseOverSuggestions.current = false;
  }

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      }),
    });
    const body = (await res.json()) as { event?: MagikEvent; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al crear el evento");
      return;
    }
    if (body.event) onCreated(body.event);
    reset({ eventName: "", clientName: "", eventType: "corporativo", place: "", date: "", description: "" });
    setClientSearch("");
    setSelectedClientId(null);
    setTypeSelectValue("corporativo");
    setCustomType("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear evento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 py-2">

          {/* Event name */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-eventName">Nombre del evento <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(opcional)</span></Label>
            <Controller
              name="eventName"
              control={control}
              render={({ field }) => (
                <Input id="ev-eventName" placeholder="Ej: Lanzamiento Samsung 2026" {...field} />
              )}
            />
          </div>

          {/* Client with autocomplete */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-clientName">Cliente</Label>
            <div style={{ position: "relative" }}>
              <Controller
                name="clientName"
                control={control}
                render={({ field }) => (
                  <Input
                    id="ev-clientName"
                    placeholder="Nombre del cliente o buscar en directorio..."
                    value={clientSearch || field.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClientSearch(val);
                      field.onChange(val);
                      setSelectedClientId(null);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => { if (clientSearch) setShowSuggestions(true); }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!mouseOverSuggestions.current) setShowSuggestions(false);
                      }, 150);
                    }}
                    autoComplete="off"
                  />
                )}
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
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    overflow: "hidden",
                  }}
                >
                  {suggestions.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectClient(c)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "var(--muted)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          margin: 0,
                        }}
                      >
                        {c.name}
                      </p>
                      {c.company && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-muted)",
                            margin: "1px 0 0",
                          }}
                        >
                          {c.company}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <div className="space-y-2">
                    <Select
                      value={typeSelectValue}
                      onValueChange={(value) => {
                        if (!value) return;
                        setTypeSelectValue(value);
                        if (value !== "otro") {
                          field.onChange(value);
                          setCustomType("");
                        } else {
                          field.onChange(customType);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>{EVENT_TYPE_LABELS[typeSelectValue] ?? typeSelectValue}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corporativo">Corporativo</SelectItem>
                        <SelectItem value="entretenimiento">Entretenimiento</SelectItem>
                        <SelectItem value="especial">Especial</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    {typeSelectValue === "otro" && (
                      <Input
                        placeholder="Especifica el tipo de evento..."
                        value={customType}
                        onChange={(e) => {
                          setCustomType(e.target.value);
                          field.onChange(e.target.value);
                        }}
                      />
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Fecha</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Input id="ev-date" type="date" {...field} />
                )}
              />
              {errors.date && (
                <p className="text-xs" style={{ color: "#E53935" }}>{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-place">Lugar</Label>
            <Controller
              name="place"
              control={control}
              render={({ field }) => (
                <Input id="ev-place" placeholder="Ciudad, venue..." {...field} />
              )}
            />
            {errors.place && (
              <p className="text-xs" style={{ color: "#E53935" }}>{errors.place.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-description">Descripción (opcional)</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea id="ev-description" placeholder="Notas adicionales..." {...field} />
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              {isSubmitting ? "Creando..." : "Crear evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

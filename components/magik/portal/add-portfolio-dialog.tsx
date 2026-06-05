"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
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
import type { PortfolioItem, MagikEvent, EventFile } from "@/lib/types";

const MAX_PHOTOS = 5;

const schema = z.object({
  eventId: z.string().min(1, "Selecciona un evento"),
  eventName: z.string().min(1),
  visible: z.boolean(),
  order: z.number().int().min(0),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: PortfolioItem) => void;
  onUpdated?: (item: PortfolioItem) => void;
  nextOrder: number;
  editItem?: PortfolioItem;
}

export function AddPortfolioDialog({
  open,
  onOpenChange,
  onCreated,
  onUpdated,
  nextOrder,
  editItem,
}: Props) {
  const isEdit = !!editItem;

  const [events, setEvents] = useState<MagikEvent[]>([]);
  const [photos, setPhotos] = useState<EventFile[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { eventId: "", eventName: "", visible: true, order: nextOrder },
  });

  const watchedEventId = watch("eventId");

  async function loadPhotos(eventId: string) {
    if (!eventId) { setPhotos([]); return; }
    setLoadingPhotos(true);
    try {
      const r = await fetchWithAuth(`/api/events/${eventId}/files`);
      const b = (await r.json()) as { files?: EventFile[] };
      setPhotos((b.files ?? []).filter((f) => f.category === "Foto"));
    } finally {
      setLoadingPhotos(false);
    }
  }

  // Seed form & photos on open
  useEffect(() => {
    if (!open) return;
    setServerError(null);
    if (isEdit && editItem) {
      reset({
        eventId: editItem.eventId,
        eventName: editItem.eventName,
        visible: editItem.visible,
        order: editItem.order,
      });
      setSelectedUrls(editItem.imageUrls);
      loadPhotos(editItem.eventId);
    } else {
      reset({ eventId: "", eventName: "", visible: true, order: nextOrder });
      setSelectedUrls([]);
      setPhotos([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load events list once per open
  useEffect(() => {
    if (open) {
      fetchWithAuth("/api/events")
        .then((r) => r.json())
        .then((b: { events?: MagikEvent[] }) => setEvents(b.events ?? []));
    }
  }, [open]);

  // Load photos when event changes (create mode only)
  useEffect(() => {
    if (watchedEventId && !isEdit) {
      setSelectedUrls([]);
      loadPhotos(watchedEventId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedEventId]);

  function togglePhoto(url: string) {
    setSelectedUrls((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url);
      if (prev.length >= MAX_PHOTOS) return prev;
      return [...prev, url];
    });
  }

  async function onSubmit(data: FormData) {
    setServerError(null);
    if (isEdit && editItem) {
      const res = await fetchWithAuth(`/api/portfolio/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: selectedUrls }),
      });
      const body = (await res.json()) as { item?: PortfolioItem; error?: string };
      if (!res.ok) { setServerError(body.error ?? "Error al actualizar"); return; }
      if (body.item && onUpdated) onUpdated(body.item);
    } else {
      const res = await fetchWithAuth("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: data.eventId,
          eventName: data.eventName,
          imageUrls: selectedUrls,
          visible: data.visible,
          order: data.order,
        }),
      });
      const body = (await res.json()) as { item?: PortfolioItem; error?: string };
      if (!res.ok) { setServerError(body.error ?? "Error al agregar al portafolio"); return; }
      if (body.item) onCreated(body.item);
    }
    onOpenChange(false);
  }

  const atMax = selectedUrls.length >= MAX_PHOTOS;
  const showPhotoPicker = watchedEventId !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar fotos del portafolio" : "Agregar evento al portafolio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 py-2">

          {/* Event selector */}
          <div className="space-y-1.5">
            <Label>Evento</Label>
            <Controller
              name="eventId"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value}
                  disabled={isEdit}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    const ev = events.find((ev) => ev.id === e.target.value);
                    if (ev) setValue("eventName", ev.eventName || ev.clientName, { shouldDirty: true });
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
                    opacity: isEdit ? 0.6 : 1,
                    cursor: isEdit ? "default" : "pointer",
                  }}
                >
                  <option value="">Seleccionar evento...</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.clientName} — {ev.date}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.eventId && (
              <p className="text-xs" style={{ color: "#E53935" }}>{errors.eventId.message}</p>
            )}
          </div>

          {/* Photo picker */}
          {showPhotoPicker && (
            <div className="space-y-2">
              <Label>Fotos</Label>
              {loadingPhotos ? (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Cargando fotos...
                </p>
              ) : photos.length === 0 ? (
                <p
                  className="rounded-md border px-3 py-3 text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--color-text-muted)" }}
                >
                  Este evento no tiene fotos subidas. Ve a la pestaña Archivos del evento y sube
                  fotos con categoría Foto primero.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                    }}
                  >
                    {photos.map((photo) => {
                      const selected = selectedUrls.includes(photo.storageUrl);
                      const disabled = atMax && !selected;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => { if (!disabled) togglePhoto(photo.storageUrl); }}
                          style={{
                            position: "relative",
                            width: "100%",
                            height: 120,
                            borderRadius: 6,
                            overflow: "hidden",
                            border: selected
                              ? "2px solid #D4004E"
                              : "1px solid rgba(255,255,255,0.10)",
                            cursor: disabled ? "default" : "pointer",
                            opacity: disabled ? 0.4 : 1,
                            padding: 0,
                            background: "#1E1E21",
                            flexShrink: 0,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.storageUrl}
                            alt={photo.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          {selected && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(212,0,78,0.35)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={24} color="#fff" strokeWidth={2.5} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {selectedUrls.length} / {MAX_PHOTOS} fotos seleccionadas
                    {atMax && (
                      <span style={{ color: "#E53935", marginLeft: 8 }}>
                        Máximo {MAX_PHOTOS} fotos por evento
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Order + Visible (create mode only) */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pf-order">Orden</Label>
                <Controller
                  name="order"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="pf-order"
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </div>
              <div className="flex items-end pb-1">
                <Controller
                  name="visible"
                  control={control}
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Visible en portal
                      </span>
                    </label>
                  )}
                />
              </div>
            </div>
          )}

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
              {isSubmitting
                ? "Guardando..."
                : isEdit
                  ? "Guardar fotos"
                  : "Agregar al portafolio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

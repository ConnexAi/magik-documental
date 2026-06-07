"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Trash2 } from "lucide-react";
import { EditEventDialog } from "./edit-event-dialog";
import { QuotesTab } from "@/components/magik/quotes/quotes-tab";
import { OrdersTab } from "@/components/magik/orders/orders-tab";
import { FilesTab } from "@/components/magik/files/files-tab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchWithAuth, getCurrentUserRole } from "@/lib/auth";
import type { MagikEvent, EventFile } from "@/lib/types";

const EVENT_TYPE_STYLES: { [key: string]: { bg: string; color: string; label: string } | undefined } = {
  corporativo: { bg: "rgba(0, 144, 217, 0.15)", color: "#0090D9", label: "Corporativo" },
  entretenimiento: { bg: "rgba(106, 166, 19, 0.15)", color: "#6AA613", label: "Entretenimiento" },
  especial: { bg: "rgba(201, 122, 26, 0.15)", color: "#C97A1A", label: "Especial" },
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

type Tab = "quotes" | "orders" | "files" | "other";

const TABS: { id: Tab; label: string }[] = [
  { id: "quotes", label: "Cotizaciones" },
  { id: "orders", label: "Órdenes de servicio" },
  { id: "files", label: "Archivos" },
  { id: "other", label: "Otros documentos" },
];

interface Props {
  event: MagikEvent;
  initialFiles: EventFile[];
}

export function EventDetailClient({ event: initialEvent, initialFiles }: Props) {
  const router = useRouter();
  const [event, setEvent] = useState<MagikEvent>(initialEvent);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("quotes");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const role = getCurrentUserRole();
  const isAdmin = mounted && role === "admin";
  const typeStyle = EVENT_TYPE_STYLES[event.eventType] ?? { bg: "rgba(90,88,96,0.2)", color: "var(--color-text-secondary)", label: event.eventType };

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetchWithAuth(`/api/events/${event.id}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/dashboard/events";
    } else {
      setDeleteError("No se pudo eliminar el evento. Intenta de nuevo.");
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/events")}
        className="mb-5 flex items-center gap-1 text-xs transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Volver a eventos
      </button>

      {/* Header card */}
      <div
        className="mb-6 rounded-lg border p-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span
              className="section-label"
              style={{ color: "var(--color-text-muted)" }}
            >
              {event.consecutive}
            </span>

            <h1
              className="text-[22px] font-medium leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {event.eventName || event.clientName}
            </h1>
            {event.eventName && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {event.clientName}
              </p>
            )}

            <div
              className="flex flex-wrap items-center gap-3 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span
                className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium"
                style={{ background: typeStyle.bg, color: typeStyle.color }}
              >
                {typeStyle.label}
              </span>

              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {event.place}
              </span>

              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {formatDate(event.date)}
              </span>
            </div>

            {event.description && (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {event.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: "rgba(229,57,53,0.35)",
                  color: "#E53935",
                  background: "rgba(229,57,53,0.06)",
                }}
              >
                <Trash2 size={13} />
                Eliminar
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--color-text-secondary)",
                background: "var(--background)",
              }}
            >
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="pb-2.5 text-[13px] font-medium transition-colors"
            style={{
              color:
                activeTab === tab.id
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
              borderBottom:
                activeTab === tab.id ? "2px solid #D4004E" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {activeTab === "quotes" && (
          <QuotesTab eventId={event.id} eventConsecutive={event.consecutive} />
        )}
        {activeTab === "orders" && (
          <OrdersTab eventId={event.id} eventConsecutive={event.consecutive} />
        )}
        {activeTab === "files" && (
          <FilesTab eventId={event.id} initialFiles={initialFiles} />
        )}
        {activeTab === "other" && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Sin contenido adicional.
          </p>
        )}
      </div>

      <EditEventDialog
        event={event}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={(updated) => setEvent(updated)}
      />

      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!v && !deleting) { setDeleteOpen(false); setDeleteError(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar evento</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Esta acción no se puede deshacer. Se eliminará el evento{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {event.consecutive}
            </strong>{" "}
            y todos sus documentos asociados.
          </p>
          {deleteError && (
            <p className="rounded-md border px-3 py-2 text-xs"
              style={{ background: "rgba(229,57,53,0.08)", borderColor: "rgba(229,57,53,0.3)", color: "#E53935" }}>
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" disabled={deleting} onClick={() => { setDeleteOpen(false); setDeleteError(null); }}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="text-white"
              style={{ background: "#E53935" }}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar } from "lucide-react";
import { EditEventDialog } from "./edit-event-dialog";
import { QuotesTab } from "@/components/magik/quotes/quotes-tab";
import { OrdersTab } from "@/components/magik/orders/orders-tab";
import { FilesTab } from "@/components/magik/files/files-tab";
import type { MagikEvent, EventFile } from "@/lib/types";

const EVENT_TYPE_STYLES: Record<
  MagikEvent["eventType"],
  { bg: string; color: string; label: string }
> = {
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
  const [activeTab, setActiveTab] = useState<Tab>("quotes");
  const typeStyle = EVENT_TYPE_STYLES[event.eventType];

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
              {event.clientName}
            </h1>

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

          <button
            onClick={() => setEditOpen(true)}
            className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
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
    </div>
  );
}

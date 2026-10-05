"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import type { ClientHistory, QuoteStatus } from "@/lib/types";

interface Props {
  clientId: string | null;
  onClose: () => void;
}

const QUOTE_STATUS: Record<QuoteStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Borrador", color: "#C97A1A", bg: "rgba(201, 122, 26, 0.15)" },
  published: { label: "Publicada", color: "#6AA613", bg: "rgba(106, 166, 19, 0.15)" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  corporativo: "Corporativo",
  entretenimiento: "Entretenimiento",
  especial: "Especial",
};

export function ClientDetailDialog({ clientId, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ClientHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) { setData(null); return; }
    setLoading(true);
    fetchWithAuth(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then((body: ClientHistory) => setData(body))
      .finally(() => setLoading(false));
  }, [clientId]);

  const open = clientId !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }} modal={false}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial del cliente</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            Cargando...
          </p>
        )}

        {!loading && data && (
          <div className="space-y-5 py-1">
            {/* Client info */}
            <div
              className="rounded-lg border p-4 space-y-2"
              style={{ borderColor: "var(--border)", background: "var(--muted)" }}
            >
              <p
                className="text-[15px] font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {data.client.name}
              </p>
              {data.client.company && (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {data.client.company}
                </p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                {data.client.email && (
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {data.client.email}
                  </span>
                )}
                {data.client.phone && (
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {data.client.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Events */}
            <div>
              <p className="section-label mb-3">
                Eventos ({data.client.eventIds.length})
              </p>

              {data.events.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Sin eventos asociados aún.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2.5"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {ev.consecutive} — {ev.clientName}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {ev.date} · {EVENT_TYPE_LABELS[ev.eventType] ?? ev.eventType} · {ev.place}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onClose();
                          router.push(`/dashboard/events/${ev.id}`);
                        }}
                        className="ml-3 shrink-0"
                      >
                        <ExternalLink size={13} className="mr-1.5" />
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Quotes */}
            <div>
              <p className="section-label mb-3">
                Cotizaciones ({data.quotes.length})
              </p>

              {data.quotes.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Sin cotizaciones en sus eventos.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.quotes.map((q) => {
                    const status = QUOTE_STATUS[q.status];
                    const event = data.events.find((ev) => ev.id === q.eventId);
                    return (
                      <div
                        key={q.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2.5"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div>
                          <p
                            className="font-mono text-sm"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {q.consecutive ?? "Sin consecutivo"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {formatDate(q.createdAt)}
                            {event ? ` · ${event.consecutive}` : ""} · {q.title}
                          </p>
                        </div>
                        <span
                          className="ml-3 shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
import type { Client, MagikEvent } from "@/lib/types";

interface ClientHistory {
  client: Client;
  events: MagikEvent[];
}

interface Props {
  clientId: string | null;
  onClose: () => void;
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

              {data.client.eventIds.length > data.events.length && (
                <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Mostrando {data.events.length} de {data.client.eventIds.length} eventos.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

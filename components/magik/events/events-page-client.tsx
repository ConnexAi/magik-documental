"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateEventDialog } from "./create-event-dialog";
import type { MagikEvent } from "@/lib/types";

const PAGE_SIZE = 20;

const EVENT_TYPE_STYLES: Record<
  MagikEvent["eventType"],
  { bg: string; color: string; label: string }
> = {
  corporativo: {
    bg: "rgba(0, 144, 217, 0.15)",
    color: "#0090D9",
    label: "Corporativo",
  },
  entretenimiento: {
    bg: "rgba(106, 166, 19, 0.15)",
    color: "#6AA613",
    label: "Entretenimiento",
  },
  especial: {
    bg: "rgba(201, 122, 26, 0.15)",
    color: "#C97A1A",
    label: "Especial",
  },
};

function EventTypeBadge({ type }: { type: MagikEvent["eventType"] }) {
  const s = EVENT_TYPE_STYLES[type];
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

interface SearchState {
  clientName: string;
  year: string;
  eventType: string;
  place: string;
}

interface Props {
  initialEvents: MagikEvent[];
}

export function EventsPageClient({ initialEvents }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<MagikEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState<SearchState>({
    clientName: "",
    year: "",
    eventType: "",
    place: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search state 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEvents = useCallback(async (filters: SearchState) => {
    const params = new URLSearchParams();
    if (filters.clientName) params.set("clientName", filters.clientName);
    if (filters.year) params.set("year", filters.year);
    if (filters.eventType) params.set("eventType", filters.eventType);
    if (filters.place) params.set("place", filters.place);

    setLoading(true);
    try {
      const res = await fetch(`/api/events?${params.toString()}`);
      if (res.ok) {
        const body = (await res.json()) as { events: MagikEvent[] };
        setEvents(body.events);
        setPage(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when debounced search changes (skip initial mount)
  const isFirstSearch =
    !debouncedSearch.clientName &&
    !debouncedSearch.year &&
    !debouncedSearch.eventType &&
    !debouncedSearch.place;

  useEffect(() => {
    if (!isFirstSearch) {
      fetchEvents(debouncedSearch);
    }
  }, [debouncedSearch, fetchEvents, isFirstSearch]);

  function handleEventCreated(event: MagikEvent) {
    setEvents((prev) => [event, ...prev]);
    setPage(0);
  }

  function updateSearch(field: keyof SearchState, value: string) {
    setSearch((prev) => ({ ...prev, [field]: value }));
  }

  const pageCount = Math.ceil(events.length / PAGE_SIZE);
  const pageEvents = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium" style={{ color: "var(--color-text-primary)" }}>
            Eventos
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            {events.length} {events.length === 1 ? "evento" : "eventos"}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          <Plus size={14} className="mr-1.5" />
          Nuevo evento
        </Button>
      </div>

      {/* Search bar */}
      <div
        className="mb-4 grid grid-cols-2 gap-2 rounded-lg border p-3 md:grid-cols-4"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <input
          type="text"
          placeholder="Cliente..."
          value={search.clientName}
          onChange={(e) => updateSearch("clientName", e.target.value)}
          className="rounded-md border px-2.5 py-1.5 text-xs outline-none transition-colors"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--color-text-primary)",
          }}
        />
        <input
          type="number"
          placeholder="Año (ej: 2025)"
          value={search.year}
          onChange={(e) => updateSearch("year", e.target.value)}
          className="rounded-md border px-2.5 py-1.5 text-xs outline-none transition-colors"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--color-text-primary)",
          }}
        />
        <select
          value={search.eventType}
          onChange={(e) => updateSearch("eventType", e.target.value)}
          className="rounded-md border px-2.5 py-1.5 text-xs outline-none transition-colors"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: search.eventType ? "var(--color-text-primary)" : "var(--color-text-muted)",
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="corporativo">Corporativo</option>
          <option value="entretenimiento">Entretenimiento</option>
          <option value="especial">Especial</option>
        </select>
        <input
          type="text"
          placeholder="Lugar..."
          value={search.place}
          onChange={(e) => updateSearch("place", e.target.value)}
          className="rounded-md border px-2.5 py-1.5 text-xs outline-none transition-colors"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["#", "Cliente", "Tipo", "Lugar", "Fecha", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span className="section-label">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Buscando...
                </td>
              </tr>
            )}
            {!loading && pageEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
                    No hay eventos registrados. Crea el primero.
                  </p>
                  <Button
                    onClick={() => setCreateOpen(true)}
                    className="text-white"
                    style={{ background: "var(--color-crimson)" }}
                  >
                    <Plus size={14} className="mr-1.5" />
                    Nuevo evento
                  </Button>
                </td>
              </tr>
            )}
            {!loading &&
              pageEvents.map((event, i) => (
                <tr
                  key={event.id}
                  onClick={() => router.push(`/dashboard/events/${event.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderTop: i === 0 ? undefined : "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--color-bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {event.consecutive}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: "var(--color-text-primary)" }}>{event.clientName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <EventTypeBadge type={event.eventType} />
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: "var(--color-text-secondary)" }}>{event.place}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {formatDate(event.date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Ver →
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pageCount > 1 && (
          <div
            className="flex items-center justify-between border-t px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Página {page + 1} de {pageCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-md px-3 py-1 text-xs font-medium disabled:opacity-40"
                style={{ background: "var(--muted)", color: "var(--color-text-primary)" }}
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="rounded-md px-3 py-1 text-xs font-medium disabled:opacity-40"
                style={{ background: "var(--muted)", color: "var(--color-text-primary)" }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleEventCreated}
      />
    </div>
  );
}

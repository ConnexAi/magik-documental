"use client";

import { useState, useEffect } from "react";
import { Plus, Download, Copy, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { CreateQuoteDialog } from "./create-quote-dialog";
import { EditQuoteDialog } from "./edit-quote-dialog";
import type { Quote } from "@/lib/types";

function money(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatusBadge({ status }: { status: Quote["status"] }) {
  const styles =
    status === "draft"
      ? { bg: "rgba(201, 122, 26, 0.15)", color: "#C97A1A", label: "Borrador" }
      : { bg: "rgba(106, 166, 19, 0.15)", color: "#6AA613", label: "Publicada" };
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium"
      style={{ background: styles.bg, color: styles.color }}
    >
      {styles.label}
    </span>
  );
}

interface ConfirmDeleteProps {
  name: string;
  open: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({ name, open, deleting, onConfirm, onCancel }: ConfirmDeleteProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar cotización</DialogTitle>
        </DialogHeader>
        <p className="text-sm py-2" style={{ color: "var(--color-text-secondary)" }}>
          ¿Estás seguro que quieres eliminar <strong>{name}</strong>? Esta acción no se puede deshacer.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            style={{ background: "#E53935", color: "#fff" }}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  eventId: string;
  eventConsecutive: string;
}

export function QuotesTab({ eventId, eventConsecutive }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWithAuth(`/api/events/${eventId}/quotes`)
      .then((r) => r.json())
      .then((b) => setQuotes(b.quotes ?? []))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleDuplicate(quote: Quote) {
    const res = await fetchWithAuth(
      `/api/events/${eventId}/quotes/${quote.id}/duplicate`,
      { method: "POST" }
    );
    const body = (await res.json()) as { quote?: Quote };
    if (res.ok && body.quote) {
      setQuotes((prev) => [body.quote!, ...prev]);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetchWithAuth(
      `/api/events/${eventId}/quotes/${deleteTarget.id}`,
      { method: "DELETE" }
    );
    setDeleting(false);
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {quotes.length} {quotes.length === 1 ? "cotización" : "cotizaciones"}
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          <Plus size={14} className="mr-1.5" />
          Nueva cotización
        </Button>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {loading && (
          <p className="px-4 py-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            Cargando...
          </p>
        )}

        {!loading && quotes.length === 0 && (
          <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            Sin cotizaciones. Crea la primera.
          </p>
        )}

        {!loading && quotes.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Título", "Ver.", "Estado", "Total", ""].map((h) => (
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
              {quotes.map((q, i) => (
                <tr
                  key={q.id}
                  style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}
                >
                  <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>
                    {q.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
                      v{q.version}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                    {money(q.total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/events/${eventId}/quotes/${q.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Descargar PDF"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Download size={14} />
                      </a>
                      <a
                        href={`/api/events/${eventId}/quotes/${q.id}/xlsx`}
                        title="Descargar XLSX"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <FileSpreadsheet size={14} />
                      </a>
                      <button
                        onClick={() => handleDuplicate(q)}
                        title="Duplicar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => setEditQuote(q)}
                        title="Editar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        title="Eliminar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateQuoteDialog
        eventId={eventId}
        eventConsecutive={eventConsecutive}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(q) => setQuotes((prev) => [q, ...prev])}
      />

      {editQuote && (
        <EditQuoteDialog
          eventId={eventId}
          quote={editQuote}
          open={!!editQuote}
          onOpenChange={(v) => { if (!v) setEditQuote(null); }}
          onUpdated={(updated) =>
            setQuotes((prev) =>
              prev.map((q) => (q.id === updated.id ? updated : q))
            )
          }
        />
      )}

      <ConfirmDeleteDialog
        name={deleteTarget?.title ?? ""}
        open={!!deleteTarget}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

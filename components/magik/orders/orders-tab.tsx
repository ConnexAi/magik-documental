"use client";

import { useState, useEffect } from "react";
import { Plus, Download, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { CreateOrderDialog } from "./create-order-dialog";
import { EditOrderDialog } from "./edit-order-dialog";
import type { ServiceOrder } from "@/lib/types";

function money(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
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
          <DialogTitle>Eliminar orden de servicio</DialogTitle>
        </DialogHeader>
        <p className="text-sm py-2" style={{ color: "var(--color-text-secondary)" }}>
          ¿Estás seguro que quieres eliminar <strong>{name}</strong>? Esta acción no se puede deshacer.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={deleting} style={{ background: "#E53935", color: "#fff" }}>
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

export function OrdersTab({ eventId, eventConsecutive }: Props) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<ServiceOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWithAuth(`/api/events/${eventId}/orders`)
      .then((r) => r.json())
      .then((b) => setOrders(b.orders ?? []))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetchWithAuth(`/api/events/${eventId}/orders/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {orders.length} {orders.length === 1 ? "orden" : "órdenes"}
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          <Plus size={14} className="mr-1.5" />
          Nueva orden
        </Button>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {loading && (
          <p className="px-4 py-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>Cargando...</p>
        )}
        {!loading && orders.length === 0 && (
          <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            No hay órdenes de servicio para este evento
          </p>
        )}
        {!loading && orders.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Título", "Proveedor", "Total", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left" style={{ color: "var(--color-text-muted)" }}>
                    <span className="section-label">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-primary)" }}>{o.title}</td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{o.providerName}</td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                    {money(o.items.reduce((s, item) => s + item.total, 0))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/api/events/${eventId}/orders/${o.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Descargar PDF"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Download size={14} />
                      </a>
                      <a
                        href={`/api/events/${eventId}/orders/${o.id}/xlsx`}
                        title="Descargar XLSX"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <FileSpreadsheet size={14} />
                      </a>
                      <button
                        onClick={() => setEditOrder(o)}
                        title="Editar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(o)}
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

      <CreateOrderDialog
        eventId={eventId}
        eventConsecutive={eventConsecutive}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(o) => setOrders((prev) => [o, ...prev])}
      />

      {editOrder && (
        <EditOrderDialog
          eventId={eventId}
          order={editOrder}
          open={!!editOrder}
          onOpenChange={(v) => { if (!v) setEditOrder(null); }}
          onUpdated={(updated) =>
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
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

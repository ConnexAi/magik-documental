"use client";

import { useState } from "react";
import { Trash2, Globe, EyeOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddPortfolioDialog } from "./add-portfolio-dialog";
import { fetchWithAuth } from "@/lib/auth";
import type { PortfolioItem } from "@/lib/types";

interface Props {
  initialItems: PortfolioItem[];
}

function ConfirmDeleteDialog({
  open,
  name,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }} modal={false}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar del portafolio</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          ¿Eliminar <strong style={{ color: "var(--color-text-primary)" }}>{name}</strong> del portafolio?
          Esta acción no se puede deshacer.
        </p>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="text-white"
            style={{ background: "#E53935" }}
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PortfolioAdminClient({ initialItems }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PortfolioItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);

  const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 0;

  async function toggleVisible(item: PortfolioItem) {
    const res = await fetchWithAuth(`/api/portfolio/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !item.visible }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, visible: !item.visible } : i))
      );
    } else {
      console.error("toggleVisible failed", res.status);
    }
  }

  async function updateOrder(item: PortfolioItem, raw: string) {
    const order = parseInt(raw);
    if (isNaN(order) || order < 0) return;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, order } : i))
    );
    await fetchWithAuth(`/api/portfolio/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetchWithAuth(`/api/portfolio/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      console.error("confirmDelete failed", res.status);
      setDeleteTarget(null);
    }
  }

  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium" style={{ color: "var(--color-text-primary)" }}>
            Portafolio
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Gestiona los eventos visibles en el portal público
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          Agregar evento
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div
          className="rounded-lg border py-16 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No hay eventos en el portafolio
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-2.5 text-left" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                  Evento
                </th>
                <th className="px-4 py-2.5 text-left" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                  Fotos
                </th>
                <th className="px-4 py-2.5 text-center" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                  Visible
                </th>
                <th className="px-4 py-2.5 text-center" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                  Orden
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderTop: idx === 0 ? undefined : "1px solid var(--border)",
                  }}
                >
                  {/* Nombre */}
                  <td className="px-4 py-3">
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {item.eventName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                      {item.imageUrls.length} imagen{item.imageUrls.length !== 1 ? "es" : ""}
                    </div>
                  </td>

                  {/* Thumbnails */}
                  <td className="px-4 py-3">
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {item.imageUrls.length === 0 ? (
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>sin fotos</span>
                      ) : (
                        item.imageUrls.map((url, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={url}
                            alt={`${item.eventName} ${i + 1}`}
                            style={{
                              width: 36,
                              height: 36,
                              objectFit: "cover",
                              borderRadius: 4,
                              border: "0.5px solid var(--border)",
                              flexShrink: 0,
                            }}
                          />
                        ))
                      )}
                    </div>
                  </td>

                  {/* Toggle visible */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleVisible(item)}
                      title={item.visible ? "Ocultar del portal" : "Mostrar en portal"}
                      style={{ color: item.visible ? "#6AA613" : "var(--color-text-muted)" }}
                    >
                      {item.visible ? <Globe size={16} /> : <EyeOff size={16} />}
                    </button>
                  </td>

                  {/* Order */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={item.order}
                      onChange={(e) => updateOrder(item, e.target.value)}
                      className="rounded border text-center text-xs outline-none"
                      style={{
                        width: 52,
                        padding: "4px 6px",
                        background: "var(--background)",
                        borderColor: "var(--border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEditTarget(item)}
                        title="Editar fotos"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        title="Eliminar"
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
        </div>
      )}

      <AddPortfolioDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        nextOrder={nextOrder}
        onCreated={(item) => {
          setItems((prev) => [...prev, item]);
          setAddOpen(false);
        }}
      />

      <AddPortfolioDialog
        open={editTarget !== null}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        nextOrder={nextOrder}
        editItem={editTarget ?? undefined}
        onCreated={() => {}}
        onUpdated={(updated) => {
          setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          setEditTarget(null);
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        name={deleteTarget?.eventName ?? ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

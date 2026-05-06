"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchWithAuth } from "@/lib/auth";
import { CreateClientDialog } from "./create-client-dialog";
import { EditClientDialog } from "./edit-client-dialog";
import { ClientDetailDialog } from "./client-detail-dialog";
import type { Client } from "@/lib/types";

function ConfirmDeleteDialog({
  name,
  open,
  deleting,
  onConfirm,
  onCancel,
}: {
  name: string;
  open: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }} modal={false}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
        </DialogHeader>
        <p className="text-sm py-2" style={{ color: "var(--color-text-secondary)" }}>
          ¿Eliminar <strong style={{ color: "var(--color-text-primary)" }}>{name}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="text-white"
            style={{ background: "#E53935" }}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  initialClients: Client[];
}

export function ClientsPageClient({ initialClients }: Props) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = search.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (c.company ?? "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : clients;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetchWithAuth(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium" style={{ color: "var(--color-text-primary)" }}>
            Clientes
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Directorio de clientes y su historial de eventos
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          <Plus size={14} className="mr-1.5" />
          Nuevo cliente
        </Button>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o empresa..."
          style={{ maxWidth: 320 }}
        />
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            {search ? "No se encontraron clientes" : "No hay clientes registrados"}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nombre", "Empresa", "Email", "Teléfono", "Eventos", ""].map((h) => (
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
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderTop: i === 0 ? undefined : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                  onClick={() => setDetailId(c.id)}
                >
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {c.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {c.company ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {c.email ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {c.eventIds.length}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEditTarget(c)}
                        title="Editar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
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

      <CreateClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(c) => {
          setClients((prev) => [c, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
          setCreateOpen(false);
        }}
      />

      {editTarget && (
        <EditClientDialog
          client={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          onUpdated={(updated) => {
            setClients((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
            setEditTarget(null);
          }}
        />
      )}

      <ConfirmDeleteDialog
        name={deleteTarget?.name ?? ""}
        open={!!deleteTarget}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ClientDetailDialog
        clientId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

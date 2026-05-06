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
import { CreateProviderDialog } from "./create-provider-dialog";
import { EditProviderDialog } from "./edit-provider-dialog";
import type { Provider } from "@/lib/types";

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
          <DialogTitle>Eliminar proveedor</DialogTitle>
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
  initialProviders: Provider[];
}

export function ProvidersPageClient({ initialProviders }: Props) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Provider | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = search.trim()
    ? providers.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : providers;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetchWithAuth(`/api/providers/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setProviders((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium" style={{ color: "var(--color-text-primary)" }}>
            Proveedores
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Directorio de proveedores de servicios técnicos
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          <Plus size={14} className="mr-1.5" />
          Nuevo proveedor
        </Button>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          style={{ maxWidth: 320 }}
        />
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            {search ? "No se encontraron proveedores" : "No hay proveedores registrados"}
          </p>
        )}

        {filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nombre", "Contacto", "Celular", "Categorías", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left" style={{ color: "var(--color-text-muted)" }}>
                    <span className="section-label">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {p.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {p.contact ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {p.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.categories.length === 0 && (
                        <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>—</span>
                      )}
                      {p.categories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-sm px-1.5 py-0.5 text-xs"
                          style={{ background: "var(--bg-elevated)", color: "var(--color-text-muted)" }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(p)}
                        title="Editar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
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

      <CreateProviderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(p) => setProviders((prev) => [p, ...prev])}
      />

      {editTarget && (
        <EditProviderDialog
          provider={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          onUpdated={(updated) => {
            setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
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
    </div>
  );
}

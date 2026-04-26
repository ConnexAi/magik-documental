"use client";

import { useState } from "react";
import { Plus, History, Trash2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { UploadTemplateDialog } from "./upload-template-dialog";
import { TemplateVersionsDialog } from "./template-versions-dialog";
import type { Template } from "@/lib/types";

function TypeBadge({ type }: { type: Template["type"] }) {
  const isQuote = type === "quote";
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium"
      style={
        isQuote
          ? { background: "rgba(0, 144, 217, 0.15)", color: "#0090D9" }
          : { background: "rgba(106, 166, 19, 0.15)", color: "#6AA613" }
      }
    >
      {isQuote ? "Cotización" : "Orden de Servicio"}
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
          <DialogTitle>Eliminar plantilla</DialogTitle>
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
  initialTemplates: Template[];
}

export function TemplatesPageClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preloadedFile, setPreloadedFile] = useState<File | null>(null);
  const [pageDragging, setPageDragging] = useState(false);
  const [versionsTarget, setVersionsTarget] = useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openDialog(file?: File) {
    setPreloadedFile(file ?? null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setPreloadedFile(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetchWithAuth(`/api/templates/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setPageDragging(true); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPageDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setPageDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) openDialog(dropped);
      }}
    >
      {pageDragging && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(212,0,78,0.08)",
            border: "3px dashed #D4004E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <p style={{ color: "#D4004E", fontSize: 18, fontWeight: 500 }}>
            Suelta el archivo para crear una nueva plantilla
          </p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium" style={{ color: "var(--color-text-primary)" }}>
            Plantillas
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Plantillas de documentos corporativos para cotizaciones y órdenes de servicio
          </p>
        </div>
        <Button
          onClick={() => openDialog()}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          <Plus size={14} className="mr-1.5" />
          Nueva plantilla
        </Button>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {templates.length === 0 && (
          <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            No hay plantillas registradas
          </p>
        )}

        {templates.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nombre", "Tipo", "Versión activa", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left" style={{ color: "var(--color-text-muted)" }}>
                    <span className="section-label">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map((t, i) => (
                <tr key={t.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {t.name}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={t.type} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
                      v{t.activeVersion}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {t.storageUrl && (
                        <a
                          href={t.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver archivo"
                          className="rounded p-1 transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => setVersionsTarget(t)}
                        title="Historial de versiones"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
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

      <UploadTemplateDialog
        open={dialogOpen}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
        onCreated={(t) => setTemplates((prev) => [t, ...prev])}
        initialFile={preloadedFile}
      />

      {versionsTarget && (
        <TemplateVersionsDialog
          template={versionsTarget}
          open={!!versionsTarget}
          onOpenChange={(v) => { if (!v) setVersionsTarget(null); }}
          onVersionPublished={(updated) =>
            setTemplates((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            )
          }
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

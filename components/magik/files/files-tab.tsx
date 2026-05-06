"use client";

import { useState, useEffect } from "react";
import { Upload, Download, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/auth";
import { UploadFileDialog } from "./upload-file-dialog";
import { RenameFileDialog } from "./rename-file-dialog";
import type { EventFile, FileCategory } from "@/lib/types";

const CATEGORIES: FileCategory[] = [
  "Foto",
  "Contrato",
  "Rider",
  "Cotización",
  "Orden de Servicio",
  "Otro",
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          <DialogTitle>Eliminar archivo</DialogTitle>
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
  initialFiles: EventFile[];
}

export function FilesTab({ eventId, initialFiles }: Props) {
  const [files, setFiles] = useState<EventFile[]>(initialFiles);
  const [activeCategory, setActiveCategory] = useState<FileCategory | "Todos">("Todos");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<EventFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWithAuth(`/api/events/${eventId}/files`)
      .then((r) => r.json())
      .then((body: { files?: EventFile[] }) => {
        if (body.files) setFiles(body.files);
      })
      .catch(() => {});
  }, [eventId]);

  const displayed =
    activeCategory === "Todos"
      ? files
      : files.filter((f) => f.category === activeCategory);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetchWithAuth(
      `/api/events/${eventId}/files/${deleteTarget.id}`,
      { method: "DELETE" }
    );
    setDeleting(false);
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {(["Todos", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="rounded px-3 py-1 text-xs font-medium transition-colors"
              style={
                activeCategory === cat
                  ? { background: "var(--color-crimson)", color: "#fff" }
                  : { background: "var(--bg-elevated)", color: "var(--color-text-muted)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          className="text-white"
          style={{ background: "var(--color-crimson)" }}
        >
          <Upload size={14} className="mr-1.5" />
          Subir archivo
        </Button>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {displayed.length === 0 && (
          <p className="px-4 py-10 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            No hay archivos en esta categoría
          </p>
        )}

        {displayed.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Nombre", "Categoría", "Tamaño", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left" style={{ color: "var(--color-text-muted)" }}>
                    <span className="section-label">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((f, i) => (
                <tr key={f.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)", maxWidth: 260 }}>
                    <span className="block truncate">{f.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{f.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {formatBytes(f.sizeBytes)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={f.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Descargar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => setRenameTarget(f)}
                        title="Renombrar"
                        className="rounded p-1 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(f)}
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

      <UploadFileDialog
        eventId={eventId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={(f) => setFiles((prev) => [f, ...prev])}
      />

      {renameTarget && (
        <RenameFileDialog
          eventId={eventId}
          file={renameTarget}
          open={!!renameTarget}
          onOpenChange={(v) => { if (!v) setRenameTarget(null); }}
          onRenamed={(updated) => {
            setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
            setRenameTarget(null);
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

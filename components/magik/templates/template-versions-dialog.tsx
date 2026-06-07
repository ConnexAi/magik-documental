"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { ExternalLink, Upload, CheckCircle2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/lib/auth";
import { storage } from "@/lib/firebase";
import type { Template, TemplateVersion } from "@/lib/types";

interface PublishFormValues {
  changelog: string;
}

interface Props {
  template: Template;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVersionPublished: (updated: Template) => void;
}

export function TemplateVersionsDialog({ template, open, onOpenChange, onVersionPublished }: Props) {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [error, setError] = useState("");

  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset } = useForm<PublishFormValues>({
    defaultValues: { changelog: "" },
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchWithAuth(`/api/templates/${template.id}/versions`)
      .then((r) => r.json())
      .then((b) => setVersions((b as { versions: TemplateVersion[] }).versions ?? []))
      .finally(() => setLoading(false));
  }, [open, template.id]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    setUploadedUrl("");
    setUploadedFileName("");
    try {
      const storageRef = ref(storage, `templates/${template.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setUploadedUrl(url);
      setUploadedFileName(file.name);
    } catch (e) {
      setError(`Error al subir: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setUploading(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function resetPublish() {
    setShowPublish(false);
    setUploadedUrl("");
    setUploadedFileName("");
    setError("");
    reset();
  }

  async function onPublish(values: PublishFormValues) {
    if (!uploadedUrl) {
      setError("Sube un archivo antes de publicar");
      return;
    }
    setPublishing(true);
    setError("");
    const nextVersion = template.activeVersion + 1;
    const res = await fetchWithAuth(`/api/templates/${template.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: nextVersion,
        storageUrl: uploadedUrl,
        changelog: values.changelog,
      }),
    });
    setPublishing(false);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Error al publicar");
      return;
    }
    const body = (await res.json()) as { version: TemplateVersion };
    setVersions((prev) => [body.version, ...prev]);
    onVersionPublished({ ...template, activeVersion: nextVersion, storageUrl: uploadedUrl });
    resetPublish();
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Versiones — {template.name}</DialogTitle>
        </DialogHeader>

        {/* Version list */}
        <div className="max-h-60 overflow-y-auto">
          {loading && (
            <p className="py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
              Cargando...
            </p>
          )}
          {!loading && versions.length === 0 && (
            <p className="py-4 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              Sin versiones publicadas
            </p>
          )}
          {!loading && versions.length > 0 && (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="py-2 text-left px-2" style={{ color: "var(--color-text-muted)" }}>Ver.</th>
                  <th className="py-2 text-left px-2" style={{ color: "var(--color-text-muted)" }}>Changelog</th>
                  <th className="py-2 text-left px-2" style={{ color: "var(--color-text-muted)" }}>Fecha</th>
                  <th className="py-2 px-2" />
                </tr>
              </thead>
              <tbody>
                {versions.map((v, i) => (
                  <tr key={v.id} style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}>
                    <td className="px-2 py-2">
                      <span className="font-mono" style={{ color: "var(--color-text-primary)" }}>
                        v{v.version}
                      </span>
                      {v.version === template.activeVersion && (
                        <span
                          className="ml-1.5 rounded-sm px-1 py-0.5 text-xs"
                          style={{ background: "rgba(106, 166, 19, 0.15)", color: "#6AA613" }}
                        >
                          activa
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2" style={{ color: "var(--color-text-secondary)" }}>
                      {v.changelog ?? "—"}
                    </td>
                    <td className="px-2 py-2" style={{ color: "var(--color-text-muted)" }}>
                      {formatDate(v.publishedAt)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {v.storageUrl && (
                        <a
                          href={v.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Publish new version */}
        {showPublish ? (
          <form onSubmit={handleSubmit(onPublish)} className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Publicar versión v{template.activeVersion + 1}
            </p>

            {/* Drop zone */}
            <div className="space-y-1.5">
              <Label>Archivo</Label>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              {uploadedUrl ? (
                <div
                  className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm"
                  style={{ borderColor: "rgba(106,166,19,0.4)", background: "rgba(106,166,19,0.06)" }}
                >
                  <CheckCircle2 size={15} color="#6AA613" />
                  <span style={{ color: "var(--color-text-primary)", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {uploadedFileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setUploadedUrl(""); setUploadedFileName(""); }}
                    style={{ fontSize: 11, color: "var(--color-text-muted)", flexShrink: 0 }}
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragOver ? "var(--color-crimson)" : "var(--border)"}`,
                    borderRadius: 8,
                    padding: "20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    cursor: uploading ? "default" : "pointer",
                    background: dragOver ? "rgba(212,0,78,0.04)" : "transparent",
                    transition: "border-color 150ms, background 150ms",
                  }}
                >
                  {uploading ? (
                    <>
                      <div style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTopColor: "var(--color-crimson)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0 }}>Subiendo archivo...</p>
                    </>
                  ) : (
                    <>
                      <Upload size={20} style={{ color: "var(--color-text-muted)" }} />
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)", margin: 0, textAlign: "center" }}>
                        Arrastra el archivo aquí o <span style={{ color: "var(--color-crimson)" }}>haz clic</span>
                      </p>
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>PDF, DOCX, XLSX...</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Changelog</Label>
              <Controller
                name="changelog"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Descripción de cambios (opcional)" />
                )}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "var(--color-crimson)" }}>{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={resetPublish} disabled={publishing || uploading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={publishing || uploading || !uploadedUrl}
                className="text-white"
                style={{ background: "var(--color-crimson)" }}
              >
                {publishing ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        ) : (
          <DialogFooter>
            <Button
              onClick={() => setShowPublish(true)}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              Publicar nueva versión
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Dialog>
  );
}

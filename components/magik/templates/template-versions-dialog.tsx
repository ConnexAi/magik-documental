"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { ExternalLink } from "lucide-react";
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
import type { Template, TemplateVersion } from "@/lib/types";

interface PublishFormValues {
  storageUrl: string;
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

  const { control, handleSubmit, reset } = useForm<PublishFormValues>({
    defaultValues: { storageUrl: "", changelog: "" },
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchWithAuth(`/api/templates/${template.id}/versions`)
      .then((r) => r.json())
      .then((b) => setVersions((b as { versions: TemplateVersion[] }).versions ?? []))
      .finally(() => setLoading(false));
  }, [open, template.id]);

  async function onPublish(values: PublishFormValues) {
    setPublishing(true);
    setError("");
    const nextVersion = template.activeVersion + 1;
    const res = await fetchWithAuth(`/api/templates/${template.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: nextVersion,
        storageUrl: values.storageUrl,
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
    onVersionPublished({ ...template, activeVersion: nextVersion, storageUrl: values.storageUrl });
    reset();
    setShowPublish(false);
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
            <div className="space-y-1.5">
              <Label>URL del archivo</Label>
              <Controller
                name="storageUrl"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="https://storage.googleapis.com/..." />
                )}
              />
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
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPublish(false)} disabled={publishing}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={publishing}
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
    </Dialog>
  );
}

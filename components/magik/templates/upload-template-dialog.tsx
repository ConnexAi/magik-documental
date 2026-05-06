"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { NativeSelect } from "@/components/magik/ui/native-select";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "@/lib/firebase";
import { fetchWithAuth } from "@/lib/auth";
import type { Template, TemplateType } from "@/lib/types";

interface FormValues {
  name: string;
  type: TemplateType | "";
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (t: Template) => void;
  initialFile?: File | null;
}

export function UploadTemplateDialog({ open, onOpenChange, onCreated, initialFile }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { name: "", type: "quote" } });

  useEffect(() => {
    if (initialFile) setFile(initialFile);
  }, [initialFile]);

  function handleClose() {
    reset();
    setFile(null);
    setError("");
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError("");
    try {
      // 1. Create template document in Firestore
      const res = await fetchWithAuth("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          type: values.type || "quote",
          activeVersion: 1,
          storageUrl: "",
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "Error al crear la plantilla");
        return;
      }
      const { template } = (await res.json()) as { template: Template };
      let finalTemplate = template;

      // 2. Upload file to Firebase Storage if provided
      if (file) {
        if (!auth.currentUser) {
          setError("No hay sesion activa. Vuelve a iniciar sesion.");
          return;
        }
        const timestamp = Date.now();
        const storageRef = ref(storage, `templates/${template.id}/${timestamp}_${file.name}`);
        await uploadBytes(storageRef, file);
        const storageUrl = await getDownloadURL(storageRef);

        // 3. PATCH template with the download URL
        const patchRes = await fetchWithAuth(`/api/templates/${template.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storageUrl }),
        });
        if (patchRes.ok) {
          const patched = (await patchRes.json()) as { template: Template };
          finalTemplate = patched.template;
        }
      }

      onCreated(finalTemplate);
      handleClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva plantilla</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "El nombre es requerido" }}
              render={({ field }) => (
                <Input {...field} placeholder="Ej. Cotización estándar" />
              )}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: "var(--color-crimson)" }}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de documento</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <NativeSelect
                  {...field}
                  placeholder="Seleccionar tipo (opcional)"
                  options={[
                    { value: "quote", label: "Cotización" },
                    { value: "serviceOrder", label: "Orden de servicio" },
                  ]}
                />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Archivo</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) setFile(dropped);
              }}
              onClick={() => document.getElementById("template-file-input")?.click()}
              style={{
                border: dragging ? "2px dashed #D4004E" : "2px dashed rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
                background: dragging ? "rgba(212,0,78,0.05)" : "transparent",
              }}
            >
              <input
                id="template-file-input"
                type="file"
                accept=".pdf,.xlsx,.docx"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <p style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
                  {file.name}
                </p>
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                  Arrastra el archivo aqui o haz clic para seleccionar
                  <br />
                  <span style={{ fontSize: 11 }}>PDF, XLSX o DOCX</span>
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--color-crimson)" }}>{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              {saving ? "Guardando..." : "Crear plantilla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

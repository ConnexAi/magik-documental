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
import type { EventFile } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { value: "Foto", label: "Foto" },
  { value: "Contrato", label: "Contrato" },
  { value: "Rider", label: "Rider" },
  { value: "Cotización", label: "Cotización" },
  { value: "Orden de Servicio", label: "Orden de Servicio" },
  { value: "Otro", label: "Otro" },
  { value: "Personalizada", label: "Personalizada..." },
];

interface FormValues {
  name: string;
  category: string;
}

interface Props {
  eventId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUploaded: (f: EventFile) => void;
  initialFile?: File | null;
}

export function UploadFileDialog({ eventId, open, onOpenChange, onUploaded, initialFile }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { name: "", category: "" } });

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      setValue("name", initialFile.name);
    }
  }, [initialFile, setValue]);

  function handleClose() {
    reset();
    setFile(null);
    setIsCustomCategory(false);
    setSelectValue("");
    setError("");
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    if (!file) {
      setError("Selecciona un archivo");
      return;
    }
    if (!auth.currentUser) {
      setError("No hay sesión activa. Vuelve a iniciar sesión.");
      return;
    }
    setError("");
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `events/${eventId}/files/${timestamp}_${file.name}`);
      await uploadBytes(storageRef, file);
      const storageUrl = await getDownloadURL(storageRef);

      const res = await fetchWithAuth(`/api/events/${eventId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name || file.name,
          category: values.category || "Otro",
          storageUrl,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "Error al guardar el archivo");
        return;
      }
      const { file: created } = (await res.json()) as { file: EventFile };
      onUploaded(created);
      handleClose();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir archivo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Archivo</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) {
                  setFile(dropped);
                  setValue("name", dropped.name);
                }
              }}
              onClick={() => document.getElementById("event-file-input")?.click()}
              style={{
                border: dragging ? "2px dashed #D4004E" : "2px dashed rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "20px 16px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
                background: dragging ? "rgba(212,0,78,0.05)" : "transparent",
              }}
            >
              <input
                id="event-file-input"
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f) {
                    setFile(f);
                    setValue("name", f.name);
                  }
                }}
              />
              {file ? (
                <p style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{file.name}</p>
              ) : (
                <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                  Arrastra el archivo aquí o haz clic para seleccionar
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "El nombre es requerido" }}
              render={({ field }) => <Input {...field} placeholder="Nombre del archivo" />}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: "var(--color-crimson)" }}>{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <>
                  <NativeSelect
                    value={selectValue}
                    placeholder="Seleccionar categoría"
                    options={CATEGORY_OPTIONS}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectValue(val);
                      if (val === "Personalizada") {
                        setIsCustomCategory(true);
                        field.onChange("");
                      } else {
                        setIsCustomCategory(false);
                        field.onChange(val);
                      }
                    }}
                  />
                  {isCustomCategory && (
                    <Input
                      className="mt-2"
                      placeholder="Escribir categoría"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                </>
              )}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: "var(--color-crimson)" }}>{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              {isSubmitting ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

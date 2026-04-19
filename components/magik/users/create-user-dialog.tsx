"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MagikUser, UserRole } from "@/lib/types";

const schema = z.object({
  displayName: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["admin", "collaborator"]),
});

type FormData = z.infer<typeof schema>;

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  collaborator: "Colaborador",
};

interface Props {
  onCreated: (user: MagikUser) => void;
}

export function CreateUserDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", password: "", role: "collaborator" },
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = (await res.json()) as { user?: MagikUser; error?: string };
    if (!res.ok) {
      setServerError(body.error ?? "Error al crear el usuario");
      return;
    }
    if (body.user) onCreated(body.user);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="text-white" style={{ background: "var(--color-crimson)" }}>
            Nuevo usuario
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 py-2">
          {/* displayName */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Nombre completo</Label>
            <Controller
              name="displayName"
              control={control}
              render={({ field }) => (
                <Input id="displayName" placeholder="Juan García" {...field} />
              )}
            />
            {errors.displayName && (
              <p className="text-xs" style={{ color: "#E53935" }}>
                {errors.displayName.message}
              </p>
            )}
          </div>

          {/* email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input id="email" type="email" placeholder="usuario@magik.co" {...field} />
              )}
            />
            {errors.email && (
              <p className="text-xs" style={{ color: "#E53935" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input id="password" type="password" placeholder="••••••••" {...field} />
              )}
            />
            {errors.password && (
              <p className="text-xs" style={{ color: "#E53935" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* role */}
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{ROLE_LABELS[field.value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="collaborator">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {serverError && (
            <p
              className="rounded-md border px-3 py-2 text-xs"
              style={{
                background: "rgba(229, 57, 53, 0.08)",
                borderColor: "rgba(229, 57, 53, 0.3)",
                color: "#E53935",
              }}
            >
              {serverError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white"
              style={{ background: "var(--color-crimson)" }}
            >
              {isSubmitting ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import type { UserRole } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

function getHomeForRole(_role: UserRole): string {
  return "/dashboard/events";
}

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    setServerError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setServerError(body.error ?? "Error al iniciar sesión");
        return;
      }

      const { role } = (await res.json()) as { role: UserRole };
      router.push(getHomeForRole(role));
    } catch {
      setServerError("Credenciales incorrectas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="w-full max-w-sm rounded-lg border p-8 shadow-lg"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <span
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--color-crimson)" }}
        >
          MAGIK
        </span>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          Producciones — Sistema de gestión
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="section-label"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="usuario@magik.co"
            {...register("email")}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-crimson"
            style={{
              borderColor: errors.email ? "#E53935" : "var(--border)",
              color: "var(--color-text-primary)",
            }}
          />
          {errors.email && (
            <p className="text-xs" style={{ color: "#E53935" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="section-label"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors"
            style={{
              borderColor: errors.password ? "#E53935" : "var(--border)",
              color: "var(--color-text-primary)",
            }}
          />
          {errors.password && (
            <p className="text-xs" style={{ color: "#E53935" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error */}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style={{ background: "var(--color-crimson)" }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

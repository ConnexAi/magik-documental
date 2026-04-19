"use client";

import { useState, useEffect } from "react";
import { ChangeRoleSelect } from "./change-role-select";
import { CreateUserDialog } from "./create-user-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import type { MagikUser, UserRole } from "@/lib/types";

function RoleBadge({ role }: { role: UserRole }) {
  const cls = role === "admin" ? "badge-admin" : "badge-collab";
  const label = role === "admin" ? "Admin" : "Colaborador";
  return <span className={cls}>{label}</span>;
}

// ─── Delete confirmation dialog (two steps) ──────────────────────────────────

type DeleteStep = "idle" | "confirm1" | "confirm2" | "deleting";

interface DeleteDialogProps {
  user: MagikUser;
  isSelf: boolean;
  onDeleted: (uid: string) => void;
}

function DeleteUserDialog({ user, isSelf, onDeleted }: DeleteDialogProps) {
  const [step, setStep] = useState<DeleteStep>("idle");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep("idle");
    setError(null);
  }

  async function handleDelete() {
    setStep("deleting");
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Error al eliminar el usuario");
        setStep("confirm2");
        return;
      }
      onDeleted(user.uid);
      reset();
    } catch {
      setError("Error de red al eliminar el usuario");
      setStep("confirm2");
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setStep("confirm1")}
        disabled={isSelf}
        title={isSelf ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
        className="rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30"
        style={{ background: "rgba(229, 57, 53, 0.12)", color: "#E53935" }}
      >
        Eliminar
      </button>

      {/* Step 1 */}
      <Dialog open={step === "confirm1"} onOpenChange={(open) => !open && reset()}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            ¿Estás seguro que quieres eliminar a{" "}
            <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
              {user.displayName}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={reset}>
              Cancelar
            </Button>
            <Button
              onClick={() => setStep("confirm2")}
              style={{ background: "var(--color-crimson)" }}
              className="text-white"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2 */}
      <Dialog
        open={step === "confirm2" || step === "deleting"}
        onOpenChange={(open) => !open && step !== "deleting" && reset()}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            ¿Confirmas que quieres eliminar permanentemente a{" "}
            <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
              {user.displayName}
            </span>{" "}
            ({user.email})? El usuario perderá acceso inmediatamente.
          </p>
          {error && (
            <p
              className="rounded-md border px-3 py-2 text-xs"
              style={{
                background: "rgba(229, 57, 53, 0.08)",
                borderColor: "rgba(229, 57, 53, 0.3)",
                color: "#E53935",
              }}
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={reset}
              disabled={step === "deleting"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={step === "deleting"}
              style={{ background: "#D32F2F" }}
              className="text-white disabled:opacity-60"
            >
              {step === "deleting" ? "Eliminando..." : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  initialUsers: MagikUser[];
}

export function UsersPageClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<MagikUser[]>(initialUsers);
  const [togglingUid, setTogglingUid] = useState<string | null>(null);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setCurrentUserUid(u?.uid ?? null);
    });
    return unsubscribe;
  }, []);

  function handleUserCreated(newUser: MagikUser) {
    setUsers((prev) => [newUser, ...prev]);
  }

  function handleRoleChange(uid: string, newRole: UserRole) {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
    );
  }

  function handleUserDeleted(uid: string) {
    setUsers((prev) => prev.filter((u) => u.uid !== uid));
  }

  async function handleToggleActive(user: MagikUser) {
    setTogglingUid(user.uid);
    const newActive = !user.active;
    setUsers((prev) =>
      prev.map((u) => (u.uid === user.uid ? { ...u, active: newActive } : u))
    );
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
      if (!res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === user.uid ? { ...u, active: user.active } : u
          )
        );
      }
    } catch {
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid ? { ...u, active: user.active } : u
        )
      );
    } finally {
      setTogglingUid(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-[22px] font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Gestión de usuarios
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            {users.length} {users.length === 1 ? "usuario" : "usuarios"}
          </p>
        </div>
        <CreateUserDialog onCreated={handleUserCreated} />
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Nombre", "Email", "Rol", "Estado", "Acciones"].map((h) => (
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
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {users.map((user, i) => (
              <tr
                key={user.uid}
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--border)",
                  background: "transparent",
                }}
              >
                {/* Nombre */}
                <td className="px-4 py-3">
                  <span style={{ color: "var(--color-text-primary)" }}>
                    {user.displayName}
                  </span>
                </td>

                {/* Email */}
                <td className="px-4 py-3">
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {user.email}
                  </span>
                </td>

                {/* Rol */}
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  {user.active ? (
                    <span
                      className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium"
                      style={{ background: "rgba(106, 166, 19, 0.15)", color: "#6AA613" }}
                    >
                      Activo
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: "rgba(90, 88, 96, 0.2)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Inactivo
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ChangeRoleSelect
                      uid={user.uid}
                      currentRole={user.role}
                      onRoleChange={handleRoleChange}
                    />
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={togglingUid === user.uid}
                      className="rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                      style={{
                        background: user.active
                          ? "rgba(229, 57, 53, 0.1)"
                          : "rgba(106, 166, 19, 0.1)",
                        color: user.active ? "#E53935" : "#6AA613",
                      }}
                    >
                      {user.active ? "Desactivar" : "Activar"}
                    </button>
                    <DeleteUserDialog
                      user={user}
                      isSelf={currentUserUid === user.uid}
                      onDeleted={handleUserDeleted}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

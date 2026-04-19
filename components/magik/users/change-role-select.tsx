"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  collaborator: "Colaborador",
};

interface Props {
  uid: string;
  currentRole: UserRole;
  onRoleChange: (uid: string, newRole: UserRole) => void;
}

export function ChangeRoleSelect({ uid, currentRole, onRoleChange }: Props) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [saving, setSaving] = useState(false);

  async function handleChange(newValue: string | null) {
    if (!newValue || newValue === role) return;
    const newRole = newValue as UserRole;
    const prevRole = role;
    setRole(newRole);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        setRole(prevRole);
      } else {
        onRoleChange(uid, newRole);
      }
    } catch {
      setRole(prevRole);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue>{ROLE_LABELS[role]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(["admin", "collaborator"] as UserRole[]).map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_LABELS[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

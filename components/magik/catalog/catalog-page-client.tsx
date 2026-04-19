"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { CreateRubroDialog } from "./create-rubro-dialog";
import { CreateProductDialog } from "./create-product-dialog";
import type { CatalogRubro, CatalogProduct } from "@/lib/types";

function formatPrice(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Props {
  initialRubros: CatalogRubro[];
}

export function CatalogPageClient({ initialRubros }: Props) {
  const [rubros, setRubros] = useState<CatalogRubro[]>(initialRubros);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [role, setRole] = useState<string | null>(null);

  // mounted pattern — role from cookie
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)magik_role=([^;]+)/);
    setRole(match ? match[1] : null);
  }, []);

  const isAdmin = role === "admin";

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleRubroCreated(rubro: CatalogRubro) {
    setRubros((prev) => [...prev, rubro]);
  }

  function handleProductCreated(rubroId: string, product: CatalogProduct) {
    setRubros((prev) =>
      prev.map((r) =>
        r.id === rubroId ? { ...r, products: [...r.products, product] } : r
      )
    );
    setExpanded((prev) => new Set(prev).add(rubroId));
  }

  async function handleDeleteRubro(rubroId: string) {
    const res = await fetch(`/api/catalog/rubros/${rubroId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRubros((prev) => prev.filter((r) => r.id !== rubroId));
    }
  }

  async function handleDeleteProduct(rubroId: string, productId: string) {
    const res = await fetch(
      `/api/catalog/rubros/${rubroId}/products/${productId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setRubros((prev) =>
        prev.map((r) =>
          r.id === rubroId
            ? { ...r, products: r.products.filter((p) => p.id !== productId) }
            : r
        )
      );
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1
            className="text-[22px] font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Catálogo
          </h1>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {rubros.length} {rubros.length === 1 ? "rubro" : "rubros"}
          </p>
        </div>
        {isAdmin && <CreateRubroDialog onCreated={handleRubroCreated} />}
      </div>

      {/* Rubros list */}
      {rubros.length === 0 && (
        <div
          className="rounded-lg border px-5 py-10 text-center"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            No hay rubros en el catálogo
          </p>
          {isAdmin && (
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Usa el botón Nuevo rubro para comenzar
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {rubros.map((rubro) => {
          const open = expanded.has(rubro.id);
          return (
            <div
              key={rubro.id}
              className="overflow-hidden rounded-lg border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* Rubro header row */}
              <div
                className="flex cursor-pointer items-center gap-3 px-4 py-3 select-none"
                onClick={() => toggleExpand(rubro.id)}
                style={{ borderBottom: open ? "1px solid var(--border)" : undefined }}
              >
                <span style={{ color: "var(--color-text-muted)" }}>
                  {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </span>

                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {rubro.name}
                </span>

                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {rubro.products.length}{" "}
                  {rubro.products.length === 1 ? "producto" : "productos"}
                </span>

                {isAdmin && (
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EditRubroButton
                      rubro={rubro}
                      onUpdated={(name) =>
                        setRubros((prev) =>
                          prev.map((r) =>
                            r.id === rubro.id ? { ...r, name } : r
                          )
                        )
                      }
                    />
                    <button
                      onClick={() => handleDeleteRubro(rubro.id)}
                      className="rounded p-1 transition-colors"
                      style={{ color: "var(--color-text-muted)" }}
                      title="Eliminar rubro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Products table */}
              {open && (
                <div>
                  {rubro.products.length > 0 && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          {["Producto", "Unidad", "Precio por defecto", ""].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-4 py-2 text-left"
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                <span className="section-label">{h}</span>
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rubro.products.map((product, i) => (
                          <tr
                            key={product.id}
                            style={{
                              borderTop:
                                i === 0 ? undefined : "1px solid var(--border)",
                            }}
                          >
                            <td className="px-4 py-2.5">
                              <span
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                {product.name}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                style={{
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                {product.unit}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                style={{
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                {formatPrice(product.defaultPrice)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {isAdmin && (
                                <button
                                  onClick={() =>
                                    handleDeleteProduct(rubro.id, product.id)
                                  }
                                  className="rounded p-1 transition-colors"
                                  style={{ color: "var(--color-text-muted)" }}
                                  title="Eliminar producto"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Add product footer */}
                  <div
                    className="px-4 py-2.5"
                    style={{
                      borderTop:
                        rubro.products.length > 0
                          ? "1px solid var(--border)"
                          : undefined,
                    }}
                  >
                    <CreateProductDialog
                      rubroId={rubro.id}
                      onCreated={(product) =>
                        handleProductCreated(rubro.id, product)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inline edit rubro name ───────────────────────────────────────────────────

interface EditRubroButtonProps {
  rubro: CatalogRubro;
  onUpdated: (name: string) => void;
}

function EditRubroButton({ rubro, onUpdated }: EditRubroButtonProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rubro.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!value.trim() || value === rubro.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/catalog/rubros/${rubro.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      onUpdated(value.trim());
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={saving}
        className="rounded border px-2 py-0.5 text-xs outline-none"
        style={{
          background: "var(--background)",
          borderColor: "var(--border)",
          color: "var(--color-text-primary)",
          width: 160,
        }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="rounded p-1 transition-colors"
      style={{ color: "var(--color-text-muted)" }}
      title="Editar nombre"
    >
      <Pencil size={14} />
    </button>
  );
}

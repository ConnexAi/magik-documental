"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronRight } from "lucide-react";
import type { CatalogRubro } from "@/lib/types";

export interface SelectedProduct {
  rubroId: string;
  rubroName: string;
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
}

interface Props {
  rubros: CatalogRubro[];
  onSelect: (product: SelectedProduct) => void;
}

export function ItemSelector({ rubros, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedRubro, setExpandedRubro] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
        style={{
          borderColor: "var(--border)",
          color: "var(--color-text-secondary)",
          background: "var(--background)",
        }}
      >
        <Plus size={13} />
        Agregar ítem
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-lg border shadow-lg"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {rubros.length === 0 && (
            <p
              className="px-3 py-4 text-center text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Catálogo vacío
            </p>
          )}
          {rubros.map((rubro, i) => (
            <div
              key={rubro.id}
              style={{ borderTop: i === 0 ? undefined : "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedRubro(
                    expandedRubro === rubro.id ? null : rubro.id
                  )
                }
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium transition-colors"
                style={{ color: "var(--color-text-primary)" }}
              >
                {rubro.name}
                <ChevronRight
                  size={12}
                  style={{
                    transform:
                      expandedRubro === rubro.id ? "rotate(90deg)" : undefined,
                    transition: "transform 150ms",
                    color: "var(--color-text-muted)",
                  }}
                />
              </button>

              {expandedRubro === rubro.id &&
                rubro.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      onSelect({
                        rubroId: rubro.id,
                        rubroName: rubro.name,
                        productId: product.id,
                        productName: product.name,
                        unit: product.unit,
                        unitPrice: product.defaultPrice,
                      });
                      setOpen(false);
                      setExpandedRubro(null);
                    }}
                    className="flex w-full items-center justify-between px-5 py-1.5 text-left text-xs transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--color-bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    <span>{product.name}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {product.unit}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

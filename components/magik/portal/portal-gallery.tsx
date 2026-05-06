"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { PortfolioItem } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LightboxState {
  itemIndex: number;
  photoIndex: number;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  state,
  onClose,
}: {
  items: PortfolioItem[];
  state: LightboxState;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(state);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const allPhotos: { url: string; eventName: string }[] = items.flatMap((item) =>
    item.imageUrls.map((url) => ({ url, eventName: item.eventName }))
  );

  const flatIndex =
    items.slice(0, current.itemIndex).reduce((acc, i) => acc + i.imageUrls.length, 0) +
    current.photoIndex;

  const goTo = useCallback(
    (flat: number) => {
      let remaining = ((flat % allPhotos.length) + allPhotos.length) % allPhotos.length;
      for (let i = 0; i < items.length; i++) {
        if (remaining < items[i].imageUrls.length) {
          setCurrent({ itemIndex: i, photoIndex: remaining });
          return;
        }
        remaining -= items[i].imageUrls.length;
      }
    },
    [allPhotos.length, items]
  );

  const prev = useCallback(() => goTo(flatIndex - 1), [flatIndex, goTo]);
  const next = useCallback(() => goTo(flatIndex + 1), [flatIndex, goTo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const photo = allPhotos[flatIndex];
  if (!photo) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    >
      <p
        style={{
          position: "absolute",
          top: 20,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 14,
          fontWeight: 500,
          color: "#F0EFF2",
          letterSpacing: "0.03em",
          pointerEvents: "none",
        }}
      >
        {photo.eventName}
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.10)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.8)",
          lineHeight: 0,
          transition: "background 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
      >
        <X size={16} />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.eventName}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "min(90vw, 1000px)",
          maxHeight: "85vh",
          objectFit: "contain",
          borderRadius: 8,
          display: "block",
          transform: visible ? "scale(1)" : "scale(0.95)",
          transition: "transform 200ms ease",
        }}
      />

      <p
        style={{
          position: "absolute",
          bottom: 20,
          fontSize: 11,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.06em",
          pointerEvents: "none",
        }}
      >
        {flatIndex + 1} / {allPhotos.length}
      </p>

      {allPhotos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 0,
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 0,
              transition: "background 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Slider helpers ───────────────────────────────────────────────────────────

function circularOffset(index: number, active: number, total: number): number {
  let offset = index - active;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

function arrowBtn(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    [side]: 12,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.4)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    lineHeight: 0,
    transition: "background 200ms",
  };
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export function PortalGallery({ items }: { items: PortfolioItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [paused, setPaused] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  function navigate(index: number) {
    setActiveIndex(index);
    setTimerKey((k) => k + 1);
  }

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(id);
  }, [items.length, paused, timerKey]);

  // ── No items ────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div
        style={{
          height: 520,
          background: "#161618",
          border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: 13, color: "#5A5860", margin: 0 }}>
          Portafolio en construcción
        </p>
      </div>
    );
  }

  // ── Single item ─────────────────────────────────────────────────────────────
  if (items.length === 1) {
    const item = items[0];
    const cover = item.imageUrls[0];
    return (
      <>
        <div
          onClick={() => cover && setLightbox({ itemIndex: 0, photoIndex: 0 })}
          style={{
            position: "relative",
            height: 520,
            borderRadius: 8,
            overflow: "hidden",
            background: "#161618",
            cursor: cover ? "pointer" : "default",
          }}
        >
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={item.eventName}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "absolute", bottom: 28, left: 32, right: 32, pointerEvents: "none" }}>
            <p style={{ fontSize: 24, fontWeight: 600, color: "#fff", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              {item.eventName}
            </p>
          </div>
        </div>
        {lightbox && (
          <Lightbox items={items} state={lightbox} onClose={() => setLightbox(null)} />
        )}
      </>
    );
  }

  // ── Multi-item slider ───────────────────────────────────────────────────────
  return (
    <div>
      <div
        style={{ position: "relative", overflow: "hidden", height: 520 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {items.map((item, index) => {
          const offset = circularOffset(index, activeIndex, items.length);
          const cover = item.imageUrls[0];
          const isActive = offset === 0;
          const isAdjacent = offset === -1 || offset === 1;

          let left: string;
          let width: string;
          let opacity: number;
          let scale: string;
          let zIndex: number;
          let cursor: string;
          let pointerEvents: "auto" | "none";

          if (isActive) {
            left = "20%"; width = "60%"; opacity = 1; scale = "scale(1)";
            zIndex = 2; cursor = "pointer"; pointerEvents = "auto";
          } else if (offset === -1) {
            left = "0%"; width = "20%"; opacity = 0.4; scale = "scale(0.9)";
            zIndex = 1; cursor = "pointer"; pointerEvents = "auto";
          } else if (offset === 1) {
            left = "80%"; width = "20%"; opacity = 0.4; scale = "scale(0.9)";
            zIndex = 1; cursor = "pointer"; pointerEvents = "auto";
          } else {
            left = offset < 0 ? "-21%" : "101%"; width = "20%"; opacity = 0; scale = "scale(0.9)";
            zIndex = 0; cursor = "default"; pointerEvents = "none";
          }

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isActive) setLightbox({ itemIndex: index, photoIndex: 0 });
                else if (isAdjacent) navigate(index);
              }}
              style={{
                position: "absolute",
                top: 0,
                left,
                width,
                height: "100%",
                opacity,
                transform: scale,
                zIndex,
                cursor,
                pointerEvents,
                transition: "left 500ms ease, width 500ms ease, opacity 500ms ease, transform 500ms ease",
                borderRadius: 8,
                overflow: "hidden",
                background: "#161618",
              }}
            >
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={item.eventName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}

              {isActive && (
                <>
                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Event name + photo dots */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 28,
                      left: 32,
                      right: 32,
                      pointerEvents: "none",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: "#fff",
                        margin: "0 0 14px",
                        textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                      }}
                    >
                      {item.eventName}
                    </p>
                    {item.imageUrls.length > 1 && (
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        {item.imageUrls.map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              background: i === 0 ? "#D4004E" : "rgba(255,255,255,0.4)",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Left arrow */}
        <button
          onClick={() => navigate((activeIndex - 1 + items.length) % items.length)}
          style={arrowBtn("left")}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,0,78,0.6)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; }}
        >
          <ChevronLeft size={32} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => navigate((activeIndex + 1) % items.length)}
          style={arrowBtn("right")}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,0,78,0.6)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; }}
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Slide dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
        }}
      >
        {items.map((_, i) => (
          <div
            key={i}
            onClick={() => navigate(i)}
            style={{
              width: i === activeIndex ? 16 : 6,
              height: i === activeIndex ? 8 : 6,
              borderRadius: 4,
              background: i === activeIndex ? "#D4004E" : "rgba(255,255,255,0.3)",
              transition: "width 300ms ease, height 300ms ease, background 300ms ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {lightbox && (
        <Lightbox items={items} state={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

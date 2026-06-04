"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export interface FlatPhoto {
  url: string;
  eventName: string;
}

const GALLERY_CSS = `
  .g-cell{position:relative;border-radius:8px;overflow:hidden;cursor:pointer;break-inside:avoid;margin-bottom:8px;}
  .g-cell img{width:100%;height:auto;display:block;object-fit:cover;transition:transform 300ms ease;}
  .g-cell:hover img{transform:scale(1.03);}
  .g-name-overlay{position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;pointer-events:none;transition:background 200ms ease;}
  .g-cell:hover .g-name-overlay{background:rgba(0,0,0,0.6);}
  .g-name-text{font-size:14px;font-weight:600;color:#fff;opacity:0;transition:opacity 200ms ease;text-align:center;padding:0 16px;line-height:1.4;}
  .g-cell:hover .g-name-text{opacity:1;}
`;

const PAGE_SIZE = 9;

function photoHeight(i: number): number {
  return (Math.floor(i / 3) + (i % 3)) % 2 === 0 ? 400 : 280;
}

function useColumns(): number {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setCols(1);
      else if (w < 1024) setCols(2);
      else setCols(3);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return cols;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: FlatPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + photos.length) % photos.length),
    [photos.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % photos.length),
    [photos.length]
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, prev, next]);

  const photo = photos[index];
  if (!photo) return null;

  const arrowStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    [side]: 16,
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
    color: "#F0EFF2",
    lineHeight: 0,
    transition: "background 150ms",
  });

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
        opacity: shown ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    >
      <p style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontSize: 14, fontWeight: 500, color: "#F0EFF2", letterSpacing: "0.03em", pointerEvents: "none" }}>
        {photo.eventName}
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#F0EFF2", lineHeight: 0, transition: "background 150ms" }}
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
        style={{ maxWidth: "min(90vw,1000px)", maxHeight: "85vh", objectFit: "contain", borderRadius: 8, display: "block", transform: shown ? "scale(1)" : "scale(0.95)", transition: "transform 200ms ease" }}
      />

      <p style={{ position: "absolute", bottom: 20, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", pointerEvents: "none" }}>
        {index + 1} / {photos.length}
      </p>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={arrowStyle("left")}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={arrowStyle("right")}
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

// ─── Gallery ──────────────────────────────────────────────────────────────────

export function PortalGallery({ photos }: { photos: FlatPhoto[] }) {
  const [page, setPage] = useState(0);
  const [fading, setFading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fadingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breakpointCols = useColumns();

  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const pagePhotos = photos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function goTo(p: number) {
    if (fadingRef.current) return;
    fadingRef.current = true;
    setFading(true);
    timeoutRef.current = setTimeout(() => {
      setPage(p);
      setFading(false);
      fadingRef.current = false;
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (photos.length === 0) {
    return (
      <div style={{ height: 400, background: "#111113", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "#6B6875", margin: 0 }}>Portafolio en construcción</p>
      </div>
    );
  }

  return (
    <>
      <style>{GALLERY_CSS}</style>
      <div style={{ opacity: fading ? 0 : 1, transition: "opacity 400ms ease" }}>
        <div
          style={{
            columns: breakpointCols === 1 ? 1 : breakpointCols === 2 ? 2 : pagePhotos.length <= 2 ? 1 : pagePhotos.length <= 4 ? 2 : 3,
            columnGap: "8px",
            width: "100%",
          }}
        >
          {pagePhotos.map((photo, i) => (
            <div
              key={`${page}-${i}`}
              className="g-cell"
              onClick={() => setLightboxIndex(page * PAGE_SIZE + i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.eventName} style={{ width: "100%", height: "auto", display: "block", objectFit: "cover" }} />
              <div className="g-name-overlay">
                <span className="g-name-text">{photo.eventName}</span>
              </div>
            </div>
          ))}
        </div>


        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 28 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === page ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === page ? "#D4004E" : "rgba(255,255,255,0.25)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 300ms ease, background 300ms ease",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

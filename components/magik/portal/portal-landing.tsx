"use client";

import { useState, useEffect, useRef, Fragment, type CSSProperties } from "react";
import {
  ChevronDown,
  Volume2,
  Lightbulb,
  Monitor,
  Video,
  Layers,
  Zap,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import type { PortfolioItem } from "@/lib/types";
import { PortalGallery, type FlatPhoto } from "./portal-gallery";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCounter(target: number, inView: boolean, duration = 1200): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let animId = 0;
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [inView, target, duration]);
  return value;
}

// ─── StatCounter ──────────────────────────────────────────────────────────────

function StatCounter({ value, label }: { value: string; label: string }) {
  const [ref, inView] = useInView(0.4);
  const match = value.match(/^(\d+)(\+?)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : "";
  const count = useCounter(target, inView);
  return (
    <div ref={ref} style={{ textAlign: "center", padding: "0 48px" }}>
      <p style={{ fontSize: 48, fontWeight: 700, color: "#D4004E", margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <p style={{ fontSize: 13, color: "#6B6875", margin: 0 }}>{label}</p>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  { Icon: Volume2,  title: "Audio" },
  { Icon: Lightbulb, title: "Iluminación" },
  { Icon: Monitor,  title: "Pantallas LED" },
  { Icon: Video,    title: "Video" },
  { Icon: Layers,   title: "Tarimas" },
  { Icon: Zap,      title: "Producción Integral" },
];

const STATS = [
  { value: "10+",  label: "Años de experiencia" },
  { value: "500+", label: "Eventos realizados" },
  { value: "2",    label: "Líneas de servicio" },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes bounceScroll {
    0%,100%{transform:translateX(-50%) translateY(0);}
    50%{transform:translateX(-50%) translateY(8px);}
  }
  .hero-el{opacity:0;transform:translateY(20px);transition:opacity 600ms ease,transform 600ms ease;transition-delay:var(--delay,0ms);}
  .hero-el.vis{opacity:1;transform:translateY(0);}
  .aos{opacity:0;transform:translateY(20px);transition:opacity 500ms ease,transform 500ms ease;}
  .aos.vis{opacity:1;transform:translateY(0);}
  .portal-wrap{max-width:1200px;margin:0 auto;padding:0 80px;}
  .hero-btn{padding:14px 28px;border-radius:9999px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;letter-spacing:0.01em;text-decoration:none;display:inline-flex;align-items:center;transition:opacity 200ms,background 200ms,border-color 200ms;}
  .hero-btn-primary{background:#F0EFF2;color:#0A0A0B;border:none;}
  .hero-btn-primary:hover{opacity:0.88;}
  .hero-btn-ghost{background:transparent;color:#F0EFF2;border:1px solid rgba(255,255,255,0.45);}
  .hero-btn-ghost:hover{border-color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.05);}
  .svc-row{display:flex;align-items:stretch;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
  .svc-row::-webkit-scrollbar{display:none;}
  .svc-item{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:140px;padding:32px 16px;}
  .svc-div{width:1px;background:rgba(255,255,255,0.1);align-self:center;height:20px;flex-shrink:0;}
  .stats-row{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;}
  .stat-div{width:1px;height:60px;background:rgba(255,255,255,0.08);}
  .contact-link{display:flex;align-items:center;gap:16px;padding:20px 0;text-decoration:none;color:#F0EFF2;font-size:14px;transition:color 150ms;}
  .contact-link:hover{color:#D4004E;}
  .contact-sep{height:1px;background:rgba(255,255,255,0.06);}
  .chevron-bounce{position:absolute;bottom:36px;left:50%;animation:bounceScroll 1.8s ease-in-out infinite;color:rgba(255,255,255,0.22);}
  @media(max-width:768px){
    .portal-wrap{padding:0 24px;}
    .stat-div{display:none;}
    .stats-row{gap:32px;}
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalLanding({ items }: { items: PortfolioItem[] }) {
  const [heroVis, setHeroVis] = useState(false);
  const [svcRef, svcInView]       = useInView();
  const [statsRef, statsInView]   = useInView();
  const [ctaRef, ctaInView]       = useInView();

  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroVis(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const photos: FlatPhoto[] = items.flatMap((item) =>
    item.imageUrls.map((url) => ({ url, eventName: item.eventName }))
  );

  const hc = (delay: number): CSSProperties =>
    ({ "--delay": `${delay}ms` } as CSSProperties);
  const hel = `hero-el${heroVis ? " vis" : ""}`;
  const aos = (inView: boolean) => `aos${inView ? " vis" : ""}`;

  return (
    <div style={{ background: "#0A0A0B", minHeight: "100vh", color: "#F0EFF2", fontFamily: "Inter, sans-serif" }}>
      <style>{CSS}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,0,78,0.06) 0%, transparent 70%), #0A0A0B",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div className="portal-wrap" style={{ width: "100%" }}>
          <div style={{ maxWidth: 520 }}>

            {/* Label pill */}
            <div className={hel} style={{ ...hc(0), marginBottom: 32 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#D4004E",
                border: "1px solid rgba(212,0,78,0.35)",
                borderRadius: 9999,
                padding: "5px 14px",
                display: "inline-block",
              }}>
                Produccion Tecnica de Eventos
              </span>
            </div>

            {/* Title */}
            <h1 className={hel} style={{ ...hc(80), margin: "0 0 24px", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
              <span style={{ display: "block", fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 800, color: "#F0EFF2" }}>
                Tu Sueñas,
              </span>
              <span style={{ display: "block", fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 800, fontStyle: "italic", color: "rgba(255,255,255,0.42)" }}>
                Nosotros Creamos.
              </span>
            </h1>

            {/* Description */}
            <p className={hel} style={{ ...hc(160), fontSize: 15, color: "#6B6875", margin: "0 0 40px", maxWidth: 380, lineHeight: 1.65 }}>
              Produccion tecnica de alta calidad para eventos corporativos,
              conciertos y producciones especiales en Colombia.
            </p>

            {/* Buttons */}
            <div className={hel} style={{ ...hc(240), display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="hero-btn hero-btn-primary"
                onClick={() => document.getElementById("portafolio")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver portafolio
              </button>
              <a href="/login" className="hero-btn hero-btn-ghost">
                Iniciar sesion
              </a>
            </div>

          </div>
        </div>

        <div className="chevron-bounce">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ── GALERÍA ───────────────────────────────────────────────────────── */}
      <section id="portafolio" style={{ padding: "80px 0" }}>
        <div className="portal-wrap">
          <PortalGallery photos={photos} />
        </div>
      </section>

      {/* ── SERVICIOS ─────────────────────────────────────────────────────── */}
      <section style={{ background: "#111113", borderTop: "0.5px solid rgba(255,255,255,0.06)", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div ref={svcRef} className="portal-wrap">
          <div className={`svc-row ${aos(svcInView)}`}>
            {SERVICES.map((svc, i) => {
              const { Icon } = svc;
              return (
                <Fragment key={svc.title}>
                  {i > 0 && <div className="svc-div" />}
                  <div className="svc-item">
                    <Icon size={20} color="#D4004E" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#F0EFF2", textAlign: "center", whiteSpace: "nowrap" }}>
                      {svc.title}
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0A0A0B", padding: "60px 0" }}>
        <div ref={statsRef} className="portal-wrap">
          <div className={`stats-row ${aos(statsInView)}`}>
            {STATS.map((stat, i) => (
              <Fragment key={stat.label}>
                {i > 0 && <div className="stat-div" />}
                <StatCounter value={stat.value} label={stat.label} />
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO ──────────────────────────────────────────────────────── */}
      <section style={{ background: "#0A0A0B", padding: "60px 0", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div ref={ctaRef} className="portal-wrap">
          <div className={aos(ctaInView)} style={{ maxWidth: 600, margin: "0 auto" }}>
            <a href="tel:+573175958405" className="contact-link">
              <Phone size={16} color="#D4004E" style={{ flexShrink: 0 }} />
              +57 317 595 8405
            </a>
            <div className="contact-sep" />
            <a href="mailto:gerencia@magikenter.com" className="contact-link">
              <Mail size={16} color="#D4004E" style={{ flexShrink: 0 }} />
              gerencia@magikenter.com
            </a>
            <div className="contact-sep" />
            <a href="https://www.magikenter.com" target="_blank" rel="noopener noreferrer" className="contact-link">
              <Globe size={16} color="#D4004E" style={{ flexShrink: 0 }} />
              WWW.MAGIKENTER.COM
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#6B6875", letterSpacing: "0.06em", margin: 0 }}>
          © 2026 MAGIK Producciones · Cali, Colombia
        </p>
      </footer>
    </div>
  );
}

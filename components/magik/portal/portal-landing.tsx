"use client";

import { useState, useEffect, useRef, Fragment, type CSSProperties } from "react";
import {
  ChevronDown,
  Zap,
  Lightbulb,
  Monitor,
  Video,
  Music,
  Star,
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
    <div ref={ref} style={{ textAlign: "center", padding: "0 56px" }}>
      <p style={{ fontSize: 56, fontWeight: 800, color: "#D4004E", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  { Icon: Zap,       title: "Audio Profesional",    desc: "Sistemas d&b, Midas y Shure para cualquier escala." },
  { Icon: Lightbulb, title: "Iluminacion",          desc: "Moving Heads, LED y control DMX de ultima generacion." },
  { Icon: Monitor,   title: "Pantallas LED",         desc: "Modulos de interior y exterior para cualquier formato." },
  { Icon: Video,     title: "Video y Medios",        desc: "Servidores Resolume, procesadores RGB Link y retornos." },
  { Icon: Music,     title: "Tarimas y Estructuras", desc: "Modulares, truss y sistemas de rigging profesional." },
  { Icon: Star,      title: "Produccion Integral",   desc: "Coordinacion tecnica completa de montaje a desmontaje." },
];

const STATS = [
  { value: "10+",  label: "Años de experiencia" },
  { value: "500+", label: "Eventos realizados" },
  { value: "2",    label: "Lineas de servicio" },
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
  .label-pill{font-size:10px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#D4004E;border:1px solid rgba(212,0,78,0.35);border-radius:9999px;padding:5px 14px;display:inline-block;}
  .hero-btn{padding:14px 28px;border-radius:9999px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;letter-spacing:0.01em;text-decoration:none;display:inline-flex;align-items:center;transition:opacity 200ms,background 200ms,border-color 200ms;}
  .hero-btn-primary{background:#F0EFF2;color:#0A0A0B;border:none;}
  .hero-btn-primary:hover{opacity:0.88;}
  .hero-btn-ghost{background:transparent;color:#F0EFF2;border:1px solid rgba(255,255,255,0.45);}
  .hero-btn-ghost:hover{border-color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.05);}
  .svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .svc-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;transition:border-color 200ms ease,background 200ms ease;}
  .svc-card:hover{border-color:rgba(212,0,78,0.3);background:rgba(212,0,78,0.04);}
  .stats-row{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;}
  .stat-div{width:1px;height:48px;background:rgba(255,255,255,0.08);}
  .contact-link{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 0;text-decoration:none;color:#F0EFF2;font-size:15px;transition:color 200ms;}
  .contact-link:hover{color:#D4004E;}
  .contact-sep{height:1px;background:rgba(255,255,255,0.08);}
  .cta-pill{color:#F0EFF2;border:none;padding:12px 32px;border-radius:9999px;background:#D4004E;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;transition:opacity 200ms;text-decoration:none;display:inline-block;letter-spacing:0.01em;}
  .cta-pill:hover{opacity:0.88;}
  .chevron-bounce{position:absolute;bottom:36px;left:50%;animation:bounceScroll 1.8s ease-in-out infinite;color:rgba(255,255,255,0.22);}
  @media(max-width:900px){.svc-grid{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:768px){
    .portal-wrap{padding:0 24px;}
    .svc-grid{grid-template-columns:1fr;}
    .stat-div{display:none;}
    .stats-row{gap:40px;}
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalLanding({ items }: { items: PortfolioItem[] }) {
  const [heroVis, setHeroVis] = useState(false);
  const [svcRef,   svcInView]   = useInView();
  const [statsRef, statsInView] = useInView();
  const [ctaRef,   ctaInView]   = useInView();

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

            {/* 1. Logo */}
            <div className={hel} style={{ ...hc(0) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo_magik.svg" alt="MAGIK" style={{ height: "36px", width: "auto", display: "block", marginBottom: "24px" }} />
            </div>

            {/* 2. Label pill */}
            <div className={hel} style={{ ...hc(80), marginBottom: 32 }}>
              <span className="label-pill">Produccion Tecnica de Eventos</span>
            </div>

            {/* 3. Titulo */}
            <h1 className={hel} style={{ ...hc(160), margin: "0 0 24px", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
              <span style={{ display: "block", fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 800, color: "#F0EFF2" }}>
                Tu Sueñas,
              </span>
              <span style={{ display: "block", fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 800, fontStyle: "italic", color: "rgba(255,255,255,0.42)" }}>
                Nosotros Creamos.
              </span>
            </h1>

            {/* 4. Descripcion */}
            <p className={hel} style={{ ...hc(240), fontSize: 15, color: "#6B6875", margin: "0 0 40px", maxWidth: 380, lineHeight: 1.65 }}>
              Produccion tecnica de alta calidad para eventos corporativos,
              conciertos y producciones especiales en Colombia.
            </p>

            {/* 5. Botones */}
            <div className={hel} style={{ ...hc(320), display: "flex", gap: 12, flexWrap: "wrap" }}>
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
      <section style={{ background: "#111113", padding: "100px 0" }}>
        <div ref={svcRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          <div className={aos(svcInView)} style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="label-pill" style={{ marginBottom: 20, display: "inline-block" }}>
              Lo que hacemos
            </span>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: "#F0EFF2", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Produccion tecnica de alto nivel
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 auto", maxWidth: 500, lineHeight: 1.65 }}>
              Cada evento es unico. Trabajamos con los mejores equipos para garantizar resultados impecables.
            </p>
          </div>

          <div className={`svc-grid ${aos(svcInView)}`} style={{ transitionDelay: "100ms" }}>
            {SERVICES.map(({ Icon, title, desc }) => (
              <div key={title} className="svc-card">
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(212,0,78,0.1)",
                  border: "1px solid rgba(212,0,78,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={18} color="#D4004E" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#F0EFF2", margin: "16px 0 8px" }}>{title}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0A0A0B", padding: "80px 0" }}>
        <div ref={statsRef} style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
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
      <section style={{ background: "#111113", padding: "100px 0" }}>
        <div ref={ctaRef} className="portal-wrap">
          <div className={aos(ctaInView)} style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>

            <h2 style={{ fontSize: 40, fontWeight: 700, color: "#F0EFF2", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Hablemos
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 0 48px", lineHeight: 1.65 }}>
              Cuentanos sobre tu proyecto y hagamos algo increible.
            </p>

            <div style={{ marginBottom: 56 }}>
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

            <div style={{
              background: "rgba(212,0,78,0.06)",
              border: "1px solid rgba(212,0,78,0.15)",
              borderRadius: 16,
              padding: 40,
            }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#F0EFF2", margin: "0 0 8px" }}>
                Sistema de gestion interno
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 24px" }}>
                Acceso exclusivo para el equipo MAGIK
              </p>
              <a href="/login" className="cta-pill">
                Iniciar sesion
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0A0A0B", borderTop: "0.5px solid rgba(255,255,255,0.08)", padding: "32px 0" }}>
        <div className="portal-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#F0EFF2" }}>MAGIK Producciones</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>© 2026 · Cali, Colombia</span>
        </div>
      </footer>
    </div>
  );
}

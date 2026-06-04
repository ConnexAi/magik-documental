"use client";

import { useState, useEffect, useRef, Fragment } from "react";
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

// ─── Static data ──────────────────────────────────────────────────────────────

const SLIDES = [
  { photo: "/assets/Beele.png",     name: "Beéle · Reinado Nacional del Turismo", desc: "Produccion de gran formato · Oct 2025", size: 520, x: "20%", y: "50%" },
  { photo: "/assets/califlow.png",  name: "Cali Vive el Flow",                    desc: "Concierto masivo · Dic 2023",           size: 380, x: "72%", y: "42%" },
  { photo: "/assets/desfile.png",   name: "Cali Exposhow",                        desc: "Produccion de moda · Oct 2018",         size: 460, x: "50%", y: "55%" },
  { photo: "/assets/FeriaCali.png", name: "66 Feria de Cali",                     desc: "Lanzamiento oficial · Dic 2023",        size: 340, x: "25%", y: "45%" },
  { photo: "/assets/teatro.png",    name: "7a. Bienal Internacional de Danza",    desc: "Produccion escenica · Nov 2025",        size: 500, x: "68%", y: "52%" },
];

const SERVICES = [
  { Icon: Zap,       title: "Audio Profesional",    desc: "Sistemas d&b, Midas y Shure para cualquier escala." },
  { Icon: Lightbulb, title: "Iluminacion",          desc: "Moving Heads, LED y control DMX de ultima generacion." },
  { Icon: Monitor,   title: "Pantallas LED",         desc: "Modulos de interior y exterior P3.9 y P4.8." },
  { Icon: Video,     title: "Video y Medios",        desc: "Servidores Resolume y pantallas de retorno Samsung." },
  { Icon: Music,     title: "Tarimas y Estructuras", desc: "Tarimas modulares, truss y rigging profesional." },
  { Icon: Star,      title: "Produccion Integral",   desc: "Coordinacion tecnica de montaje a desmontaje." },
];

const STATS = [
  { value: "10+",  label: "Años de experiencia" },
  { value: "500+", label: "Eventos realizados" },
  { value: "2",    label: "Lineas de servicio" },
];

type SidebarItem = { label: string; id: string } | { label: string; href: string };

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "PORTAFOLIO", id: "portafolio" },
  { label: "SERVICIOS",  id: "servicios" },
  { label: "CONTACTO",   id: "contacto" },
  { label: "ACCESO",     href: "/login" },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
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
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
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
      <p style={{ fontFamily: "var(--font-body)", fontSize: 56, fontWeight: 700, color: "#D4004E", margin: "0 0 4px", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {count}{suffix}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
    </div>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar() {
  const [active, setActive] = useState("portafolio");

  useEffect(() => {
    const ids = SIDEBAR_ITEMS
      .filter((s): s is { label: string; id: string } => "id" in s)
      .map((s) => s.id);
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }); },
      { threshold: 0, rootMargin: "-35% 0px -35% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const itemStyle = (isActive: boolean): React.CSSProperties => ({
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    transform: "rotate(180deg)",
    fontSize: 9,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    color: isActive ? "#ffffff" : "rgba(255,255,255,0.2)",
    textDecoration: "none",
    transition: "color 200ms ease",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
  });

  return (
    <nav
      className="right-sb"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: 40,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: "15%", height: "70%", width: "0.5px", background: "rgba(255,255,255,0.08)" }} />
      {SIDEBAR_ITEMS.map((item) => {
        const isActive = "id" in item && item.id === active;
        if ("href" in item) {
          return <a key={item.label} href={item.href} style={itemStyle(false)}>{item.label}</a>;
        }
        return (
          <button
            key={item.label}
            style={itemStyle(isActive)}
            onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Circle Section ───────────────────────────────────────────────────────────

function CircleSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasReached, setHasReached] = useState(false);

  // Detectar cuando la seccion entra en viewport
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasReached(true); },
      { threshold: 0.1 }
    );
    const el = document.getElementById("portafolio");
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scroll para cambiar slides
  useEffect(() => {
    function handleScroll() {
      const section = document.getElementById("portafolio");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight - window.innerHeight;
      if (sectionHeight <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
      setCurrentSlide(Math.min(Math.floor(progress * 5), 4));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const slide = SLIDES[currentSlide];
  const xNum = parseInt(slide.x);
  const gap = slide.size / 2 + 28;

  const infoStyle: React.CSSProperties = {
    position: "absolute",
    top: slide.y,
    transform: "translateY(-50%)",
    maxWidth: 240,
    opacity: hasReached ? 1 : 0,
    transition: "opacity 400ms ease, top 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    pointerEvents: "none",
  };
  if (xNum < 50) {
    infoStyle.left = `calc(${slide.x} + ${gap}px)`;
  } else {
    infoStyle.right = `calc(100% - ${slide.x} + ${gap}px)`;
  }

  return (
    <div id="portafolio" style={{ height: "400vh", position: "relative", background: "#0A0A0B" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "#0A0A0B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Circle — visible como forma vacia antes de llegar, con foto al llegar */}
        <div
          style={{
            position: "absolute",
            left: slide.x,
            top: slide.y,
            transform: "translate(-50%, -50%)",
            width: slide.size,
            height: slide.size,
            borderRadius: "50%",
            overflow: "hidden",
            transition: "all 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            border: `2px solid ${hasReached ? "transparent" : "rgba(255,255,255,0.15)"}`,
            background: hasReached ? "transparent" : "rgba(255,255,255,0.03)",
          }}
        >
          {SLIDES.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={s.photo}
              alt={s.name}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: hasReached && i === currentSlide ? 1 : 0,
                transition: "opacity 600ms ease",
              }}
            />
          ))}
        </div>

        {/* Event info */}
        <div style={infoStyle}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 700, color: "white", margin: "0 0 6px", lineHeight: 1.2 }}>
            {slide.name}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
            {slide.desc}
          </p>
        </div>

        {/* Dots */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 2 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === currentSlide ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i === currentSlide ? "#D4004E" : "rgba(255,255,255,0.2)",
              transition: "width 200ms ease, background 200ms ease",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounce {
    0%,100% { transform: translateX(-50%) translateY(0); }
    50%      { transform: translateX(-50%) translateY(6px); }
  }
  .hero-item { opacity: 0; animation: fadeUp 700ms ease forwards; }
  .aos { opacity:0; transform:translateY(20px); transition:opacity 600ms ease,transform 600ms ease; }
  .aos.vis { opacity:1; transform:translateY(0); }
  .chevron-down { position:absolute; bottom:32px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,0.25); animation:bounce 2s ease-in-out infinite; }
  .pw { margin:0 auto; padding:0 40px; }
  .about-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; }
  .svc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .svc-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:28px; transition:border-color 200ms,background 200ms; }
  .svc-card:hover { border-color:rgba(212,0,78,0.25); background:rgba(212,0,78,0.04); }
  .stats-row { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; }
  .stat-div { width:1px; height:48px; background:rgba(255,255,255,0.08); }
  .ct-link { display:flex; align-items:center; gap:12px; padding:20px 0; text-decoration:none; color:white; font-family:var(--font-body); font-size:15px; transition:color 200ms; }
  .ct-link:hover { color:#D4004E; }
  .ct-sep { border-bottom:1px solid rgba(255,255,255,0.07); }
  .hero-btn-w { background:#ffffff; color:#0A0A0B; border:none; padding:14px 32px; border-radius:999px; font-family:var(--font-body); font-size:14px; font-weight:600; cursor:pointer; transition:opacity 200ms; }
  .hero-btn-w:hover { opacity:0.85; }
  .hero-btn-g { background:transparent; color:white; border:1.5px solid rgba(255,255,255,0.35); padding:14px 32px; border-radius:999px; font-family:var(--font-body); font-size:14px; font-weight:600; cursor:pointer; transition:border-color 200ms; text-decoration:none; display:inline-flex; align-items:center; }
  .hero-btn-g:hover { border-color:white; }
  .cta-btn { background:#D4004E; color:white; padding:12px 32px; border-radius:999px; font-family:var(--font-body); font-size:14px; font-weight:600; display:inline-block; text-decoration:none; transition:opacity 200ms; }
  .cta-btn:hover { opacity:0.85; }
  @media(max-width:900px){ .svc-grid { grid-template-columns:repeat(2,1fr); } }
  @media(max-width:768px){
    .pw { padding:0 24px; }
    .about-grid { grid-template-columns:1fr; gap:32px; }
    .svc-grid { grid-template-columns:1fr; }
    .stat-div { display:none; }
    .stats-row { gap:40px; }
    .right-sb { display:none; }
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────

export function PortalLanding({ items }: { items: PortfolioItem[] }) {
  const [aboutRef, aboutInView] = useInView();
  const [svcRef,   svcInView]   = useInView();
  const [statsRef, statsInView] = useInView();
  const [ctaRef,   ctaInView]   = useInView();

  const photos: FlatPhoto[] = items.flatMap((item) =>
    item.imageUrls.map((url) => ({ url, eventName: item.eventName }))
  );

  const aos = (v: boolean) => `aos${v ? " vis" : ""}`;

  return (
    <div style={{ background: "#0A0A0B", minHeight: "100vh", color: "white", fontFamily: "var(--font-body)" }}>
      <style>{CSS}</style>
      <RightSidebar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,0,78,0.07) 0%, transparent 70%), #0A0A0B",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <div className="hero-item" style={{ animationDelay: "0ms" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logoBlanco.png"
            alt="MAGIK Producciones"
            style={{ height: "96px", width: "auto", maxWidth: "320px", display: "block", margin: "0 auto 32px" }}
          />
        </div>

        <p
          className="hero-item"
          style={{
            animationDelay: "120ms",
            fontFamily: "var(--font-body)",
            fontSize: "clamp(20px, 3vw, 36px)",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            marginBottom: 40,
          }}
        >
          Produccion y logistica, al mas alto nivel.
        </p>

        <div className="hero-item" style={{ animationDelay: "240ms", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            className="hero-btn-w"
            onClick={() => document.getElementById("portafolio")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver portafolio
          </button>
          <a href="/login" className="hero-btn-g">Acceso</a>
        </div>

        <div className="chevron-down">
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ── CIRCLE SECTION ────────────────────────────────────────────────── */}
      <CircleSection />

      {/* ── GALERÍA PÚBLICA ───────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="pw" style={{ maxWidth: 1200 }}>
          <PortalGallery photos={photos} />
        </div>
      </section>

      {/* ── TEXTO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0f0f11", padding: "100px 0" }}>
        <div ref={aboutRef} className={`pw ${aos(aboutInView)}`} style={{ maxWidth: 1100 }}>
          <div className="about-grid">
            {/* Columna izquierda */}
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", color: "#D4004E", textTransform: "uppercase", margin: "0 0 16px" }}>
                Quienes somos
              </p>
              <h2 style={{ fontFamily: "var(--font-body)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, color: "white", lineHeight: 1.2, margin: 0 }}>
                Mas de 17 anos creando experiencias.
              </h2>
            </div>

            {/* Columna derecha */}
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", margin: 0 }}>
                TTS GROUP S.A.S., bajo la marca{" "}
                <span style={{ color: "#D4004E" }}>Magik Entertainment</span>
                , es una compania especializada en produccion tecnica y logistica de eventos.
                Con mas de 17 anos de experiencia ejecutamos montajes de alto nivel para
                clientes que exigen resultados, calidad y confiabilidad.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginTop: 20 }}>
                Entendemos que cada evento es igual de importante sin importar su escala.
                Escuchamos a nuestros clientes y combinamos su vision con nuestra experiencia
                y tecnologia de punta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ─────────────────────────────────────────────────────── */}
      <section id="servicios" style={{ background: "#111113", padding: "100px 0" }}>
        <div ref={svcRef} className="pw" style={{ maxWidth: 1100 }}>
          <div className={aos(svcInView)} style={{ textAlign: "center", marginBottom: 60 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#D4004E", textTransform: "uppercase", margin: "0 0 16px" }}>
              Lo que hacemos
            </p>
            <h2 style={{ fontFamily: "var(--font-body)", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 600, color: "white", margin: 0, letterSpacing: "-0.02em" }}>
              Produccion tecnica de alto nivel
            </h2>
          </div>
          <div className={`svc-grid ${aos(svcInView)}`} style={{ transitionDelay: "100ms" }}>
            {SERVICES.map(({ Icon, title, desc }) => (
              <div key={title} className="svc-card">
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(212,0,78,0.08)", border: "1px solid rgba(212,0,78,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color="#D4004E" />
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, color: "white", margin: "16px 0 8px" }}>{title}</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0A0A0B", padding: "80px 0" }}>
        <div ref={statsRef} className="pw" style={{ maxWidth: 800 }}>
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
      <section id="contacto" style={{ background: "#111113", padding: "100px 0" }}>
        <div ref={ctaRef} className="pw" style={{ maxWidth: 560 }}>
          <div className={aos(ctaInView)} style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-body)", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 600, color: "white", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              Hablemos
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 0 48px" }}>
              Cuentanos sobre tu proyecto y hagamos algo increible.
            </p>
            <div>
              <a href="tel:+573175958405" className="ct-link">
                <Phone size={16} color="#D4004E" style={{ flexShrink: 0 }} />
                +57 317 595 8405
              </a>
              <div className="ct-sep" />
              <a href="mailto:gerencia@magikenter.com" className="ct-link">
                <Mail size={16} color="#D4004E" style={{ flexShrink: 0 }} />
                gerencia@magikenter.com
              </a>
              <div className="ct-sep" />
              <a href="https://www.magikenter.com" target="_blank" rel="noopener noreferrer" className="ct-link">
                <Globe size={16} color="#D4004E" style={{ flexShrink: 0 }} />
                WWW.MAGIKENTER.COM
              </a>
            </div>
            <div style={{ background: "rgba(212,0,78,0.05)", border: "1px solid rgba(212,0,78,0.12)", borderRadius: 16, padding: "40px 32px", marginTop: 48 }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 20, fontWeight: 600, color: "white", margin: "0 0 8px" }}>
                Sistema de gestion MAGIK
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "0 0 24px" }}>
                Acceso exclusivo para el equipo
              </p>
              <a href="/login" className="cta-btn">Iniciar sesion</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0A0A0B", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 0" }}>
        <div className="pw" style={{ maxWidth: 1100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logoBlanco.png" alt="MAGIK" style={{ height: 32, width: "auto", display: "block" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            © 2026 MAGIK Producciones · Cali, Colombia
          </span>
        </div>
      </footer>
    </div>
  );
}

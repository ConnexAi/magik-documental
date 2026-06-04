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

// ─── Static data ──────────────────────────────────────────────────────────────

const M_PHOTOS = [
  { src: "/assets/Beele.png",     name: "Beéle · Reinado Nacional del Turismo 2025" },
  { src: "/assets/califlow.png",  name: "Cali Vive el Flow 2023" },
  { src: "/assets/desfile.png",   name: "Cali Exposhow 2018" },
  { src: "/assets/FeriaCali.png", name: "66 Feria de Cali 2023" },
  { src: "/assets/teatro.png",    name: "7a. Bienal Internacional de Danza 2025" },
];

type SidebarItem = { label: string; id: string } | { label: string; href: string };

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Portafolio", id: "portafolio" },
  { label: "Servicios",  id: "servicios" },
  { label: "Contacto",   id: "contacto" },
  { label: "Acceso",     href: "/login" },
];

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

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar() {
  const [active, setActive] = useState("portafolio");

  useEffect(() => {
    const sectionIds = SIDEBAR_ITEMS
      .filter((s): s is { label: string; id: string } => "id" in s)
      .map((s) => s.id);

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0, rootMargin: "-35% 0px -35% 0px" }
    );
    elements.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const itemStyle = (isActive: boolean): CSSProperties => ({
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    fontSize: 9,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: isActive ? "#ffffff" : "rgba(255,255,255,0.25)",
    textDecoration: "none",
    transition: "color 200ms ease",
    fontFamily: "var(--font-inter), Inter, sans-serif",
    fontWeight: 500,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  });

  return (
    <nav
      className="portal-sidebar"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        zIndex: 1000,
      }}
    >
      {/* Vertical line */}
      <div style={{
        position: "absolute",
        left: 0,
        top: "10%",
        height: "80%",
        width: "0.5px",
        background: "rgba(255,255,255,0.1)",
      }} />

      {SIDEBAR_ITEMS.map((item) => {
        const isActive = "id" in item && item.id === active;
        const scrollTo = "id" in item
          ? () => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })
          : undefined;

        if ("href" in item) {
          return (
            <a key={item.label} href={item.href} style={itemStyle(false)}>
              {item.label}
            </a>
          );
        }
        return (
          <button key={item.label} style={itemStyle(isActive)} onClick={scrollTo}>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── M Section ────────────────────────────────────────────────────────────────

function MSection() {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const section = document.getElementById("portafolio");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight - window.innerHeight;
      if (sectionHeight <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
      const photoIndex = Math.floor(progress * M_PHOTOS.length);
      setCurrentPhoto(Math.min(photoIndex, M_PHOTOS.length - 1));
      setIsVisible(scrolled > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div id="portafolio" style={{ height: "300vh", position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#0A0A0B",
        }}
      >
        {/* SVG M with photo mask */}
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <mask id="m-mask">
              <rect width="100%" height="100%" fill="black" />
              <text
                x="50%"
                y="58%"
                textAnchor="middle"
                dominantBaseline="auto"
                fontFamily='"Playfair Display", "Georgia", "Times New Roman", serif'
                fontWeight="900"
                fontSize="clamp(700px, 100vh, 1000px)"
                fill="white"
              >
                M
              </text>
            </mask>
          </defs>
          {M_PHOTOS.map((photo, i) => (
            <image
              key={i}
              href={photo.src}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              mask="url(#m-mask)"
              style={{
                opacity: i === currentPhoto && isVisible ? 1 : 0,
                transition: "opacity 600ms ease",
              }}
            />
          ))}
        </svg>

        {/* Photo indicators */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {M_PHOTOS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentPhoto ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentPhoto ? "#D4004E" : "rgba(255,255,255,0.25)",
                  transition: "width 300ms ease, background 300ms ease",
                }}
              />
            ))}
          </div>
          <p
            style={{
              fontSize: 11,
              color: isVisible ? "rgba(255,255,255,0.5)" : "transparent",
              letterSpacing: "0.08em",
              margin: 0,
              textTransform: "uppercase",
              transition: "color 400ms ease",
              whiteSpace: "nowrap",
            }}
          >
            {M_PHOTOS[currentPhoto].name}
          </p>
        </div>
      </div>
    </div>
  );
}

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
  .hero-btn{padding:12px 28px;border-radius:9999px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:0.01em;text-decoration:none;display:inline-flex;align-items:center;transition:transform 200ms,opacity 200ms;}
  .hero-btn:hover{transform:scale(1.02);}
  .hero-btn-primary{background:#F0EFF2;color:#0A0A0B;border:none;}
  .hero-btn-ghost{background:transparent;color:#F0EFF2;border:1px solid rgba(255,255,255,0.3);}
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
  .chevron-bounce{position:absolute;bottom:36px;left:50%;animation:bounceScroll 1.8s ease-in-out infinite;color:rgba(255,255,255,0.3);}
  @media(max-width:900px){.svc-grid{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:768px){
    .portal-wrap{padding:0 24px;}
    .svc-grid{grid-template-columns:1fr;}
    .stat-div{display:none;}
    .stats-row{gap:40px;}
    .portal-sidebar{display:none !important;}
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────

export function PortalLanding({ items }: { items: PortfolioItem[] }) {
  const [heroVis, setHeroVis] = useState(false);
  const [aboutRef, aboutInView] = useInView();
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

      <RightSidebar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,0,78,0.06) 0%, transparent 70%), #0A0A0B",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div className={hel} style={{ ...hc(0), marginBottom: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logoBlanco.png"
            alt="MAGIK Producciones"
            style={{ height: 72, width: "auto", display: "block" }}
          />
        </div>

        {/* Tagline */}
        <p
          className={hel}
          style={{
            ...hc(80),
            fontSize: "clamp(28px, 4vw, 52px)",
            fontFamily: '"Playfair Display", var(--font-playfair), Georgia, serif',
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            maxWidth: 600,
            margin: "0 auto 36px",
          }}
        >
          Produccion y logistica, al mas alto nivel.
        </p>

        {/* Buttons */}
        <div
          className={hel}
          style={{ ...hc(160), display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
        >
          <button
            className="hero-btn hero-btn-primary"
            onClick={() => document.getElementById("portafolio")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver portafolio
          </button>
          <a href="/login" className="hero-btn hero-btn-ghost">
            Acceso
          </a>
        </div>

        <div className="chevron-bounce">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ── M SECTION (scroll-driven) ─────────────────────────────────────── */}
      <MSection />

      {/* ── GALERÍA PÚBLICA ───────────────────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="portal-wrap">
          <PortalGallery photos={photos} />
        </div>
      </section>

      {/* ── ABOUT TEXT ────────────────────────────────────────────────────── */}
      <section style={{ background: "#111113", padding: "120px 80px" }}>
        <div ref={aboutRef} style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p
            className={aos(aboutInView)}
            style={{
              fontFamily: '"Playfair Display", var(--font-playfair), Georgia, serif',
              fontWeight: 700,
              fontSize: "clamp(18px, 2.5vw, 36px)",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.9)",
              margin: 0,
            }}
          >
            TTS GROUP S.A.S., bajo la marca{" "}
            <span style={{ color: "#D4004E" }}>Magik Entertainment</span>
            , es una compania colombiana especializada en produccion tecnica y logistica de eventos
            y espectaculos. Con mas de 17 anos de experiencia en los sectores publico y privado,
            ejecutamos montajes tecnologicos de alto nivel para clientes que exigen resultados,
            calidad y confiabilidad.
          </p>
          <p
            className={aos(aboutInView)}
            style={{
              fontFamily: '"Playfair Display", var(--font-playfair), Georgia, serif',
              fontWeight: 700,
              fontSize: "clamp(18px, 2.5vw, 36px)",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.9)",
              margin: "32px 0 0",
              transitionDelay: "100ms",
            }}
          >
            Entendemos que cada evento que producimos, sin importar su tamano, es igual de
            importante. Escuchamos a nuestros clientes y combinamos sus necesidades con nuestra
            experiencia, una metodologia de trabajo probada, equipos de ultima tecnologia y un
            soporte tecnico del mas alto nivel.{" "}
            <span style={{ color: "#D4004E" }}>Magik Entertainment</span>.
          </p>
        </div>
      </section>

      {/* ── SERVICIOS ─────────────────────────────────────────────────────── */}
      <section id="servicios" style={{ background: "#0A0A0B", padding: "100px 0" }}>
        <div ref={svcRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

          <div className={aos(svcInView)} style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="label-pill" style={{ marginBottom: 20, display: "inline-block" }}>
              Lo que hacemos
            </span>
            <h2 style={{ fontSize: 64, fontWeight: 400, color: "#F0EFF2", margin: "0 0 12px", letterSpacing: "0.02em", fontFamily: "var(--font-bebas), sans-serif", lineHeight: 1 }}>
              Produccion tecnica de alto nivel
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", margin: "0 auto", maxWidth: 500, lineHeight: 1.65 }}>
              Cada evento es unico. Trabajamos con los mejores equipos para garantizar resultados impecables.
            </p>
          </div>

          <div className={`svc-grid ${aos(svcInView)}`} style={{ transitionDelay: "100ms" }}>
            {SERVICES.map(({ Icon, title, desc }) => (
              <div key={title} className="svc-card">
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(212,0,78,0.1)", border: "1px solid rgba(212,0,78,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
      <section id="contacto" style={{ background: "#111113", padding: "100px 0" }}>
        <div ref={ctaRef} className="portal-wrap">
          <div className={aos(ctaInView)} style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>

            <h2 style={{ fontSize: 64, fontWeight: 400, color: "#F0EFF2", margin: "0 0 12px", letterSpacing: "0.02em", fontFamily: "var(--font-bebas), sans-serif", lineHeight: 1 }}>
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

            <div style={{ background: "rgba(212,0,78,0.06)", border: "1px solid rgba(212,0,78,0.15)", borderRadius: 16, padding: 40 }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: "#F0EFF2", margin: "0 0 8px" }}>
                Sistema de gestion interno
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 24px" }}>
                Acceso exclusivo para el equipo MAGIK
              </p>
              <a href="/login" className="cta-pill">Iniciar sesion</a>
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

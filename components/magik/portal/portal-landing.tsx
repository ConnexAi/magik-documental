"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Zap,
  Lightbulb,
  Monitor,
  Video,
  Music,
  Star,
} from "lucide-react";
import type { PortfolioItem } from "@/lib/types";
import { PortalGallery } from "./portal-gallery";

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    Icon: Zap,
    title: "Audio Profesional",
    desc: "Sistemas d&b audiotechnik, Midas y Shure para cada escala de evento.",
  },
  {
    Icon: Lightbulb,
    title: "Iluminación",
    desc: "Parques de luz Moving Heads, LED y sistemas de control DMX de última generación.",
  },
  {
    Icon: Monitor,
    title: "Pantallas LED",
    desc: "Módulos LED de interior y exterior P3.9 y P4.8 para cualquier formato.",
  },
  {
    Icon: Video,
    title: "Video y Medios",
    desc: "Servidores Resolume, procesadores RGB Link y pantallas de retorno Samsung.",
  },
  {
    Icon: Music,
    title: "Tarimas y Estructuras",
    desc: "Tarimas modulares, estructuras de truss y sistemas de rigging profesional.",
  },
  {
    Icon: Star,
    title: "Producción Integral",
    desc: "Coordinación técnica completa desde el montaje hasta el desmontaje.",
  },
];

const STATS = [
  { value: "10+", label: "Años de experiencia" },
  { value: "500+", label: "Eventos realizados" },
  { value: "2", label: "Líneas de servicio" },
];

const CONTACT = {
  phone: "+57 317 595 8405",
  email: "gerencia@magikenter.com",
  web: "WWW.MAGIKENTER.COM",
  webHref: "https://www.magikenter.com",
};

const SOCIAL = [
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "Facebook", href: "#" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounceScroll {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(8px); }
  }
  .hero-content {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 800ms ease, transform 800ms ease;
  }
  .hero-content.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 500ms ease, transform 500ms ease;
  }
  .animate-on-scroll.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .chevron-bounce {
    animation: bounceScroll 1.8s ease-in-out infinite;
  }
  .service-card {
    background: #161618;
    border: 0.5px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 24px;
    transition: border-color 200ms ease, transform 200ms ease;
  }
  .service-card:hover {
    border-color: rgba(255,255,255,0.14);
    transform: translateY(-2px);
  }
  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .contact-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }
  @media (max-width: 768px) {
    .services-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 480px) {
    .services-grid { grid-template-columns: 1fr !important; }
    .contact-grid  { grid-template-columns: 1fr !important; gap: 24px !important; }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalLanding({ items }: { items: PortfolioItem[] }) {
  const [heroVisible, setHeroVisible] = useState(false);

  const [servicesRef, servicesInView] = useInView();
  const [portfolioRef, portfolioInView] = useInView();
  const [aboutRef, aboutInView] = useInView();
  const [contactRef, contactInView] = useInView();

  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function scrollToPortfolio() {
    document.getElementById("seccion-portafolio")?.scrollIntoView({ behavior: "smooth" });
  }

  const vis = (inView: boolean, delay?: number): React.CSSProperties =>
    delay !== undefined ? { transitionDelay: `${delay}ms` } : {};
  const cls = (inView: boolean) => `animate-on-scroll${inView ? " visible" : ""}`;

  return (
    <div style={{ background: "#0E0E0F", minHeight: "100vh", color: "#F0EFF2", fontFamily: "Inter, sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div className={`hero-content${heroVisible ? " visible" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo_magik.svg"
            alt="MAGIK"
            height={56}
            style={{ width: "auto", maxWidth: 240, display: "block", margin: "0 auto 40px", objectFit: "contain" }}
          />

          <h1
            style={{
              fontSize: "clamp(34px, 5.5vw, 56px)",
              fontWeight: 600,
              color: "#F0EFF2",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: "0 0 20px",
            }}
          >
            Tu Sueñas,<br />Nosotros Creamos.
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "#5A5860",
              margin: "0 0 40px",
              letterSpacing: "0.01em",
            }}
          >
            Producción técnica de eventos audiovisuales · Cali, Colombia
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={scrollToPortfolio}
              style={{
                padding: "11px 26px",
                borderRadius: 8,
                border: "0.5px solid rgba(255,255,255,0.45)",
                background: "transparent",
                color: "#F0EFF2",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "border-color 200ms, background 200ms",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Ver portafolio
            </button>
            <a
              href="/login"
              style={{
                padding: "11px 26px",
                borderRadius: 8,
                border: "none",
                background: "#D4004E",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "0.01em",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                transition: "background 200ms",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#b8003f"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#D4004E"; }}
            >
              Iniciar sesión
            </a>
          </div>
        </div>

        <div
          className="chevron-bounce"
          style={{ position: "absolute", bottom: 32, color: "rgba(255,255,255,0.22)" }}
        >
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ── SERVICIOS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div ref={servicesRef} style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p
            className={cls(servicesInView)}
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5A5860",
              marginBottom: 40,
            }}
          >
            Lo que hacemos
          </p>

          <div className="services-grid">
            {SERVICES.map((service, i) => {
              const { Icon } = service;
              return (
                <div
                  key={service.title}
                  className={`service-card ${cls(servicesInView)}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <Icon
                    size={28}
                    color="#D4004E"
                    style={{ marginBottom: 16, display: "block" }}
                  />
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#F0EFF2",
                      margin: "0 0 8px",
                    }}
                  >
                    {service.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#5A5860",
                      margin: 0,
                      lineHeight: 1.65,
                    }}
                  >
                    {service.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PORTAFOLIO ────────────────────────────────────────────────────── */}
      <section
        id="seccion-portafolio"
        style={{
          padding: "80px 24px",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <div ref={portfolioRef} style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p
            className={cls(portfolioInView)}
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5A5860",
              marginBottom: 12,
            }}
          >
            Nuestro trabajo
          </p>
          <h2
            className={cls(portfolioInView)}
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: "#F0EFF2",
              margin: "0 0 40px",
              letterSpacing: "-0.01em",
              transitionDelay: "80ms",
            }}
          >
            Magik en Acción
          </h2>

          <div className={cls(portfolioInView)} style={{ transitionDelay: "160ms" }}>
            {items.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: "#5A5860",
                  textAlign: "center",
                  padding: "48px 0",
                }}
              >
                Portafolio en construcción.
              </p>
            ) : (
              <PortalGallery items={items} />
            )}
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ─────────────────────────────────────────────────── */}
      <section
        style={{
          background: "#161618",
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          padding: "80px 24px",
        }}
      >
        <div ref={aboutRef} style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div
            className={cls(aboutInView)}
            style={{ maxWidth: 640, margin: "0 auto 56px", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: 16,
                color: "#C0BFC4",
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              Magik Entertainment es una compañía colombiana especializada en la producción
              de espectáculos y entretenimiento técnico. Trabajamos con los mejores, realizando
              montajes tecnológicos con la más alta calidad para eventos corporativos, conciertos
              y producciones especiales.
            </p>
          </div>

          <div
            className={cls(aboutInView)}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 64,
              flexWrap: "wrap",
              transitionDelay: "150ms",
            }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 40,
                    fontWeight: 600,
                    color: "#D4004E",
                    margin: "0 0 6px",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: 13, color: "#5A5860", margin: 0 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div ref={contactRef} style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p
            className={cls(contactInView)}
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5A5860",
              marginBottom: 40,
            }}
          >
            Contacto
          </p>

          <div
            className={`contact-grid ${cls(contactInView)}`}
            style={{ marginBottom: 40, ...vis(contactInView, 80) }}
          >
            <div>
              <p style={labelStyle}>Tel</p>
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                style={contactValueStyle}
              >
                {CONTACT.phone}
              </a>
            </div>
            <div>
              <p style={labelStyle}>Email</p>
              <a
                href={`mailto:${CONTACT.email}`}
                style={{ ...contactValueStyle, color: "#D4004E" }}
              >
                {CONTACT.email}
              </a>
            </div>
            <div>
              <p style={labelStyle}>Web</p>
              <a
                href={CONTACT.webHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...contactValueStyle, color: "#C0BFC4" }}
              >
                {CONTACT.web}
              </a>
            </div>
          </div>

          <div
            className={cls(contactInView)}
            style={{ display: "flex", gap: 24, ...vis(contactInView, 160) }}
          >
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                style={{
                  fontSize: 13,
                  color: "#5A5860",
                  textDecoration: "none",
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#C0BFC4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#5A5860"; }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "0.5px solid rgba(255,255,255,0.06)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 11, color: "#5A5860", letterSpacing: "0.06em", margin: 0 }}>
          © 2026 MAGIK Producciones · Producción Técnica de Eventos
        </p>
      </footer>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "#5A5860",
  margin: "0 0 8px",
};

const contactValueStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#F0EFF2",
  textDecoration: "none",
  display: "block",
};

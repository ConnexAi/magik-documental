"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { logout } from "@/lib/auth";
import { getCurrentUserRole } from "@/lib/auth";
import {
  Calendar,
  FileText,
  Package,
  Users,
  UserCog,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Truck,
  Globe,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Eventos", href: "/dashboard/events", icon: <Calendar size={16} /> },
  { label: "Plantillas", href: "/dashboard/templates", icon: <FileText size={16} /> },
  { label: "Catálogo", href: "/dashboard/catalog", icon: <Package size={16} /> },
  { label: "Proveedores", href: "/dashboard/providers", icon: <Truck size={16} /> },
  { label: "Portafolio", href: "/dashboard/admin/portfolio", icon: <Globe size={16} />, adminOnly: true },
  { label: "Clientes", href: "/dashboard/admin/clients", icon: <Users size={16} />, adminOnly: true },
  { label: "Usuarios", href: "/dashboard/admin/users", icon: <UserCog size={16} />, adminOnly: true },
];

function SidebarLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const src = !mounted || resolvedTheme === "dark"
    ? "/assets/logoBlanco.png"
    : "/assets/logoNegro.png";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="MAGIK"
      width="160"
      height="44"
      style={{ display: "block", height: "120px", width: "auto", marginTop: "-24px", marginBottom: "-24px" }}
    />
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: 28, height: 28 }} />;
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-md p-1.5 transition-colors"
      style={{ color: "var(--color-text-secondary)" }}
      title="Cambiar tema"
    >
      {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = getCurrentUserRole();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const visibleItems = mounted
    ? NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin")
    : NAV_ITEMS.filter((item) => !item.adminOnly);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className="fixed left-0 top-0 z-30 flex h-screen flex-col border-r"
        style={{
          width: 220,
          background: "var(--sidebar)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <Link href="/dashboard/events">
            <SidebarLogo />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="rounded-md p-1.5 md:hidden"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="section-label mb-3 px-2">Navegación</p>
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          className="border-t px-3 py-3"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-left"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="hidden md:block">
        <Sidebar open={true} onClose={() => {}} />
      </div>

      <div className="md:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <main
        className="min-h-screen md:ml-[220px]"
        style={{ color: "var(--foreground)" }}
      >
        <div
          className="flex items-center gap-3 border-b px-4 py-3 md:hidden"
          style={{
            background: "var(--sidebar)",
            borderColor: "var(--sidebar-border)",
          }}
        >
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} style={{ color: "var(--color-text-secondary)" }} />
          </button>
          <Link href="/dashboard/events">
            <SidebarLogo />
          </Link>
        </div>

        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

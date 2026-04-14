"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Boxes,
  ClipboardList,
  ChevronRight,
  FolderTree,
  LineChart,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  SquareTerminal,
  Tag,
  TicketPercent,
  ReceiptText,
  UserCircle2,
  Users,
  Wallet,
  Settings,
  DatabaseBackup,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const ADMIN_SECTIONS = [
  {
    title: "Dashboard",
    items: [{ href: "/dueno", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Gestion Comercial",
    items: [
      { href: "/ventas", label: "Ventas", icon: Wallet },
      { href: "/inventario", label: "Inventario", icon: Boxes },
      { href: "/categorias", label: "Categorias", icon: Tag },
      { href: "/ofertas", label: "Ofertas", icon: TicketPercent },
      { href: "/pronostico-comercial", label: "Pronostico comercial", icon: LineChart },
      { href: "/reportes-ventas", label: "Reportes de ventas", icon: ReceiptText },
      { href: "/bitacora-comercial", label: "Bitacora comercial", icon: ClipboardList },
    ],
  },
  {
    title: "Operacion",
    items: [{ href: "/caja", label: "Caja", icon: Wallet }],
  },
  {
    title: "Administracion del Sistema",
    items: [
      { href: "/monitoreo-bd", label: "Monitoreo", icon: Activity },
      { href: "/respaldos", label: "Respaldos", icon: DatabaseBackup },
      { href: "/logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    title: "Seguridad",
    items: [
      { href: "/usuarios", label: "Usuarios", icon: Users },
      { href: "/roles", label: "Roles", icon: Shield },
    ],
  },
  {
    title: "Configuracion",
    items: [{ href: "/configuracion", label: "Configuracion", icon: Settings }],
  },
  {
    title: "Perfil",
    items: [{ href: "/perfil", label: "Perfil", icon: UserCircle2 }],
  },
];

const QUICK_ACTIONS = [
  { href: "/ventas", label: "Ventas", icon: Wallet },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/reportes-ventas", label: "Reportes", icon: ReceiptText },
  { href: "/respaldos", label: "Respaldos", icon: DatabaseBackup },
];

function isItemActive(pathname, href) {
  if (href === "/dueno") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ collapsed, pathname, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[#F2E7B6] px-4 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFCE00] text-[#1F2933] shadow-[0_12px_30px_rgba(255,206,0,0.35)]">
          <SquareTerminal size={20} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C28A00]">
              La Pape
            </p>
            <p className="truncate text-sm font-semibold text-[#1F2933]">
              Panel administrativo
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {ADMIN_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={[
                      "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-[#FFEE99] text-[#1F2933] shadow-[0_12px_28px_rgba(255,206,0,0.22)]"
                        : "text-[#4B5563] hover:bg-white hover:text-[#1F2933]",
                      collapsed ? "justify-center" : "",
                    ].join(" ")}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
                        active ? "bg-[#1F2933] text-[#FFCE00]" : "bg-[#FFF8DB] text-[#8A6B00] group-hover:bg-[#FFF1B8]",
                      ].join(" ")}
                    >
                      <Icon size={18} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight
                          size={16}
                          className={active ? "text-[#1F2933]" : "text-[#B0B7C3] group-hover:text-[#7C8797]"}
                        />
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#F2E7B6] p-3">
        <div className="rounded-3xl bg-[linear-gradient(145deg,#FFF7D1,#FFFFFF)] p-4 shadow-[0_16px_36px_rgba(255,206,0,0.12)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1F2933] text-[#FFCE00]">
              <Sparkles size={18} />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">Dashboard listo</p>
                <p className="text-xs text-[#6B7280]">Navegacion por categorias</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-[1600px]",
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentUserName = useMemo(() => {
    const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim();
    return fullName || user?.email || "Dueño";
  }, [user]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFF8DB_0%,#FFFDF4_18%,#F7F9FC_100%)] text-[#1F2933]">
      <div className="flex min-h-screen">
        <aside
          className={[
            "hidden border-r border-[#F2E7B6] bg-[#FFF6D8]/90 backdrop-blur xl:flex xl:sticky xl:top-0 xl:h-screen",
            collapsed ? "w-[104px]" : "w-[312px]",
          ].join(" ")}
        >
          <SidebarContent collapsed={collapsed} pathname={pathname} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-[#1F2933]/45 xl:hidden" onClick={() => setMobileOpen(false)}>
            <div
              className="h-full w-[292px] border-r border-[#F2E7B6] bg-[#FFF6D8] shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarContent collapsed={false} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
            <div className={`${maxWidthClassName} mx-auto px-4 py-4 sm:px-6`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F0E3B0] bg-white text-[#1F2933] xl:hidden"
                    aria-label="Abrir menu lateral"
                  >
                    <Menu size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollapsed((current) => !current)}
                    className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-[#F0E3B0] bg-white text-[#1F2933] xl:inline-flex"
                    aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                  >
                    {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                  </button>

                  <label className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-[#F4E8B4] bg-[#FFFDF6] px-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                    <Search size={18} className="text-[#B08900]" />
                    <input
                      type="search"
                      placeholder="Buscar modulo, accion o seccion..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
                    />
                  </label>

                  <div className="hidden items-center gap-2 lg:flex">
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={action.href}
                          href={action.href}
                          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#DCE7F8] bg-white px-4 text-sm font-medium text-[#315F93] transition hover:bg-[#F4F8FF]"
                        >
                          <Icon size={16} />
                          <span>{action.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F0E3B0] bg-white text-[#1F2933]"
                    aria-label="Notificaciones"
                  >
                    <Bell size={18} />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#FFCE00]" />
                  </button>

                  <div className="hidden items-center gap-3 rounded-2xl border border-[#F0E3B0] bg-white px-3 py-2 sm:flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1F2933] text-sm font-semibold text-[#FFCE00]">
                      {String(currentUserName).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1F2933]">{currentUserName}</p>
                      <p className="text-xs text-[#6B7280]">Dueño</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B08900]">
                      Administracion central
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1F2933] sm:text-4xl">
                      {title}
                    </h1>
                    {subtitle && <p className="mt-2 max-w-3xl text-sm text-[#667085] sm:text-base">{subtitle}</p>}
                  </div>

                  <div className="flex items-center gap-3 rounded-3xl border border-[#F4E8B4] bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF3BF] text-[#9A6B00]">
                      <FolderTree size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1F2933]">Navegacion escalable</p>
                      <p className="text-xs text-[#667085]">Sidebar por categorias y vistas reutilizadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <section className={`${maxWidthClassName} mx-auto`}>
              <div className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-6 lg:p-8">
                {children}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

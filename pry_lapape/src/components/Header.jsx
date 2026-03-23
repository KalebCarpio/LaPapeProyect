"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import useUser from "@/hooks/useUser";
import {
  UserPlus,
  LogIn,
  ShoppingCart,
  Search,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { PrimaryButton, SecondaryButton } from "./Buttons";

/** Mapea el rol a etiqueta amigable */
const roleLabel = (rol) =>
  ({ CLIENTE: "CLIENTE", TRABAJADOR: "TRABAJADOR", DUENO: "DUEÑO" }[
    (rol || "").toUpperCase()
  ] || "CLIENTE");

const normalizeRole = (rol) => (rol || "").toUpperCase();

const navByRole = {
  PUBLIC: [
    { href: "/", label: "Inicio" },
    { href: "/catalogo", label: "Catálogo" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contacto" },
  ],
  CLIENTE: [
    { href: "/cliente", label: "Inicio" },
    { href: "/catalogo", label: "Catálogo" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contacto" },
  ],
  TRABAJADOR: [
    { href: "/trabajador", label: "Inicio" },
    { href: "/pedidos", label: "Pedidos" },
    { href: "/inventario", label: "Inventario" },
    { href: "/clientes", label: "Clientes" },
  ],
  DUENO: [
    { href: "/dueno", label: "Inicio" },
    { href: "/reportes", label: "Reportes" },
    { href: "/productos", label: "Productos" },
    { href: "/monitoreo-bd", label: "Monitoreo" },
    { href: "/respaldos", label: "Respaldos" },
    { href: "/caja", label: "Caja" },
    { href: "/configuracion", label: "Configuración" },
  ],
};

/** Badge de marca (cuando está logueado no navega) */
function BrandBadge({ isAuth }) {
  const Wrapper = isAuth ? "div" : Link;
  const wrapperProps = isAuth ? {} : { href: "/" };

  return (
    <Wrapper {...wrapperProps} className="flex items-center group cursor-pointer">
      <div
        className="
          h-16 w-16 md:h-20 md:w-20
          rounded-2xl md:rounded-3xl
          p-2 md:p-3
          bg-gradient-to-br from-[#FFD54F] to-[#FFB300]
          shadow-xl ring-2 ring-[#FFD54F]/20
          overflow-hidden
          transition-all duration-300 
          group-hover:shadow-2xl group-hover:scale-[1.06] group-hover:ring-[#FFD54F]/40
        "
      >
        <div className="w-full h-full bg-white/90 rounded-xl flex items-center justify-center p-1">
          <Image
            src="/logo-lapape.jpg"
            alt="La Pape - Papelería Creativa"
            width={112}
            height={112}
            sizes="(max-width: 768px) 64px, 112px"
            quality={100}
            className="h-full w-full object-contain drop-shadow-sm"
            priority
          />
        </div>
      </div>
    </Wrapper>
  );
}

export default function Header({ isAuth, user, onSignOut }) {
  const { user: storedUser, signOut } = useUser();
  const resolvedUser = user ?? storedUser;
  const resolvedIsAuth =
    typeof isAuth === "boolean" ? isAuth : Boolean(resolvedUser);
  const handleSignOut = onSignOut || signOut || (() => {});

  const role = normalizeRole(resolvedUser?.rol || resolvedUser?.role);
  const navItems = resolvedIsAuth
    ? navByRole[role] || navByRole.CLIENTE
    : navByRole.PUBLIC;
  const showCartLink = !resolvedIsAuth || role === "CLIENTE" || !role;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#F0F0F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <BrandBadge isAuth={resolvedIsAuth} />

          {/* Nav principal (desktop) */}
          <nav className="hidden lg:flex items-center gap-9 ml-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-semibold text-[#333333] hover:text-[#4A90E2] transition-colors relative py-2 group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#4A90E2] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Búsqueda (desktop) */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-6">
            <div className="relative flex-1">
              <label className="flex items-center gap-3 h-11 px-4 rounded-2xl border-2 border-[#E0E0E0] bg-white hover:border-[#4A90E2] transition-colors focus-within:border-[#4A90E2] focus-within:shadow-sm">
                <Search size={18} className="text-[#666666]" />
                <input
                  className="outline-none flex-1 text-[#1C1C1C] placeholder-[#6B7280] bg-transparent"
                  placeholder="Buscar productos..."
                />
              </label>
            </div>
          </div>

          {/* Acciones derecha */}
          <div className="flex items-center gap-3">
            {/* Carrito (solo público/cliente) */}
            {showCartLink && (
              <Link
                href="/carrito"
                className="relative p-3 rounded-2xl bg-[#FFF9E6] text-[#1C1C1C] hover:bg-[#FFD54F] transition-colors duration-200 group"
              >
                <ShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EC5DBB] text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
                  3
                </span>
              </Link>
            )}

            {/* Si NO está autenticado: botones Entrar/Registro */}
            {!resolvedIsAuth ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="cursor-pointer">
                  <SecondaryButton className="flex items-center gap-2 px-4 py-2 hover:scale-[1.02] transition">
                    <LogIn size={16} />
                    <span>Entrar</span>
                  </SecondaryButton>
                </Link>
                <Link href="/registro" className="cursor-pointer">
                  <PrimaryButton className="flex items-center gap-2 px-4 py-2 hover:scale-[1.02] transition">
                    <UserPlus size={16} />
                    <span>Registro</span>
                  </PrimaryButton>
                </Link>
              </div>
            ) : (
              // Si está autenticado: píldora de rol + menú
              <div className="hidden md:flex items-center gap-2 relative">
                {/* Píldora con rol */}
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-full border-2 border-[#4A90E2] text-[#4A90E2] bg-white hover:bg-[#E9F3FF] transition cursor-pointer"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E9F3FF] text-[#4A90E2] text-xs font-bold">
                    {String(resolvedUser?.nombre || "P")
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <span className="text-xs font-bold">
                    {roleLabel(resolvedUser?.rol || resolvedUser?.role)}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {/* Menú desplegable */}
                {menuOpen && (
                  <div
                    className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-lg border border-[#F0F0F0] py-2 z-50"
                    role="menu"
                  >
                    <Link
                      href="/perfil"
                      className="flex items-center gap-3 px-4 py-2 text-[#1C1C1C] hover:bg-[#FFF5D6] transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={16} /> Ver perfil
                    </Link>
                    <Link
                      href="/configuracion"
                      className="flex items-center gap-3 px-4 py-2 text-[#1C1C1C] hover:bg-[#FFF5D6] transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings size={16} /> Configuración
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[#E53935] hover:bg-[#FFE8E7] transition"
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botón menú móvil */}
            <button
              className="md:hidden p-2 rounded-xl border border-[#E0E0E0] bg-white hover:bg-[#FFF9E6] transition-colors cursor-pointer"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              <Menu size={20} className="text-[#1C1C1C]" />
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 p-6 bg-white rounded-2xl border border-[#F0F0F0] shadow-lg space-y-4">
            <div className="flex items-center gap-3 h-12 px-4 rounded-2xl border-2 border-[#E0E0E0] bg-white">
              <Search size={18} className="text-[#666666]" />
              <input
                className="outline-none flex-1 text-[#1C1C1C] placeholder-[#6B7280] bg-transparent"
                placeholder="Buscar productos..."
              />
            </div>

            <nav className="space-y-3">
              {[...navItems, ...(showCartLink ? [{ href: "/carrito", label: "Carrito" }] : [])].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block font-semibold text-[#333333] hover:text-[#4A90E2] transition-colors py-2 border-b border-[#F0F0F0]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {!resolvedIsAuth ? (
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <SecondaryButton className="w-full flex items-center justify-center gap-2 py-3 cursor-pointer">
                    <LogIn size={16} />
                    Iniciar sesión
                  </SecondaryButton>
                </Link>
                <Link href="/registro" onClick={() => setIsMenuOpen(false)}>
                  <PrimaryButton className="w-full flex items-center justify-center gap-2 py-3 cursor-pointer">
                    <UserPlus size={16} />
                    Crear cuenta
                  </PrimaryButton>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/perfil"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#FFF5D6]"
                >
                  <User size={16} /> Ver perfil
                </Link>
                <Link
                  href="/configuracion"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#FFF5D6]"
                >
                  <Settings size={16} /> Configuración
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg text-[#E53935] hover:bg-[#FFE8E7]"
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

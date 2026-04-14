"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import AdminShell from "@/components/AdminShell";

// A dónde mandar a cada rol si intenta entrar donde no debe
const DASHBOARD_BY_ROLE = {
  CLIENTE: "/cliente",
  TRABAJADOR: "/trabajador",
  DUENO: "/dueno",
  ADMIN: "/admin", // por si después tienes panel admin
};

export default function RoleLayout({
  title,
  subtitle,
  requiredRole, // "CLIENTE" | "TRABAJADOR" | "DUENO" | "ADMIN"
  requiredRoles,
  maxWidthClassName = "max-w-6xl",
  children,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const normalizedRoles = (
    Array.isArray(requiredRoles) && requiredRoles.length > 0
      ? requiredRoles
      : requiredRole
        ? [requiredRole]
        : []
  ).map((role) => String(role || "").toUpperCase());
  const isOwnerView = normalizedRoles.some((role) => role === "DUENO" || role === "ADMIN");

  useEffect(() => {
    // Si no hay sesión → al login
    if (!user) {
      router.replace("/login");
      return;
    }

    const role = (user.rol || user.role || "").toUpperCase();
    const expected = normalizedRoles;

    // Si el rol del usuario NO coincide con el requerido → redirigir a su panel
    if (role && expected.length > 0 && !expected.includes(role)) {
      const target = DASHBOARD_BY_ROLE[role] || "/login";
      router.replace(target);
    }
  }, [user, normalizedRoles, router]);

  // Mientras no hay usuario (cargando / redirigiendo)
  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FFF9E6]">
          <p className="text-sm text-[#4B5563]">Cargando sesión...</p>
        </main>
      </>
    );
  }

  const role = (user.rol || user.role || "").toUpperCase();
  const expected = normalizedRoles;

  // Por seguridad extra: si el rol no coincide
  if (expected.length > 0 && !expected.includes(role)) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#FFF9E6] px-4">
          <div className="max-w-md w-full rounded-2xl bg-white border border-[#F97316]/30 px-6 py-5 shadow-[0_12px_30px_rgba(248,181,0,0.25)]">
            <h1 className="text-lg font-semibold text-[#1F2933]">
              Acceso denegado
            </h1>
            <p className="mt-1 text-sm text-[#4B5563]">
              No tienes permisos para ver esta sección. Te estamos redirigiendo a tu
              panel correspondiente.
            </p>
          </div>
        </main>
      </>
    );
  }

  // Layout normal con fondo CREMITA en toda la pantalla
  if (isOwnerView) {
    return (
      <AdminShell title={title} subtitle={subtitle} maxWidthClassName={maxWidthClassName}>
        {children}
      </AdminShell>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-80px)] bg-[#FFF9E6] px-4 py-8">
        <section className={`${maxWidthClassName} mx-auto`}>
          <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#2B2A28]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm md:text-base text-[#4B5563]">
                  {subtitle}
                </p>
              )}
            </div>
          </header>

          {/* Contenedor principal tipo tarjeta clara */}
          <div className="rounded-3xl bg-white/95 border border-[#FFE9A8] p-6 md:p-8 shadow-[0_20px_45px_rgba(245,158,11,0.25)]">
            {children}
          </div>
        </section>
      </main>
    </>
  );
}

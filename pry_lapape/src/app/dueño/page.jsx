"use client";

import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { BarChart3, Wallet, Settings, ShieldCheck, Store } from "lucide-react";

export default function DuenoPage() {
  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Panel de Dueño"
      subtitle="Indicadores clave, caja y configuración general."
    >
      {/* Cabecera ejecutiva */}
      <section className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#F59E0B]">
          Dirección general · La Pape
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2933]">
          Visión general del <span className="text-[#1D6FD1]">negocio</span>
        </h2>
        <p className="mt-2 text-sm text-[#4B5563] max-w-2xl mx-auto">
          Monitorea las ventas, controla la caja y ajusta la configuración general de tu
          papelería desde un solo lugar.
        </p>
      </section>

      {/* Tarjetas: acciones rápidas + salud del negocio */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        {/* Acciones rápidas de dueño */}
        <div className="rounded-3xl bg-white/95 border border-[#FFE9A8] shadow-[0_18px_40px_rgba(245,158,11,0.25)] px-5 sm:px-8 py-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-[0.18em]">
                Accesos clave
              </p>
              <p className="mt-1 text-sm text-[#4B5563] max-w-md">
                Consulta reportes, revisa caja del día y ajusta la configuración general
                del sistema.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-semibold text-[#C05621]">
              <Store size={14} />
              <span>La Pape</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-5">
            <QuickAction
              label="Ver reportes"
              icon={<BarChart3 size={16} />}
              onClick={() => (location.href = "/reportes")}
            />
            <QuickAction
              label="Caja del día"
              icon={<Wallet size={16} />}
              onClick={() => (location.href = "/caja")}
            />
            <QuickAction
              label="Configuración"
              icon={<Settings size={16} />}
              onClick={() => (location.href = "/configuracion")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#E0F2FE] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#0369A1] uppercase tracking-[0.16em]">
                Ventas
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Revisa ingresos diarios y tendencia por sucursal.
              </p>
            </div>
            <div className="rounded-2xl bg-[#ECFDF5] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#047857] uppercase tracking-[0.16em]">
                Caja
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Controla cortes, arqueos y movimientos de efectivo.
              </p>
            </div>
            <div className="rounded-2xl bg-[#EEF2FF] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#4338CA] uppercase tracking-[0.16em]">
                Seguridad
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Ajusta roles, permisos y métodos de autenticación.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-[#6B7280]">
            Tip: Revisa periódicamente los accesos y roles para cumplir con las buenas
            prácticas de seguridad del sistema.
          </p>
        </div>

        {/* Salud del negocio */}
        <div className="rounded-3xl bg-white/95 border border-[#E5E7EB] shadow-[0_18px_40px_rgba(15,23,42,0.12)] px-5 py-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-[0.18em]">
              Salud del negocio
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[#374151]">
              <li className="flex items-center justify-between">
                <span>Ventas diarias</span>
                <span className="rounded-full bg-[#DBEAFE] text-[#1D4ED8] px-2 py-0.5 text-xs font-semibold">
                  Ver en reportes
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Estado de caja</span>
                <span className="text-xs text-[#059669] font-medium">
                  Control desde módulo Caja
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Seguridad y accesos</span>
                <span className="inline-flex items-center gap-1 text-xs text-[#4F46E5] font-medium">
                  <ShieldCheck size={14} />
                  Revisar configuración
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => (location.href = "/reportes")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFD54F] hover:bg-[#FFC107] text-[#111827] text-sm font-semibold px-4 py-2.5 shadow-[0_10px_25px_rgba(245,158,11,0.45)] transition"
          >
            Ir a reportes
          </button>
        </div>
      </section>

      {/* Tarjetas principales */}
      <section className="mt-8 grid md:grid-cols-3 gap-4">
        <StatCard
          title="Ventas"
          desc="Ingresos y tendencia"
          href="/reportes"
          icon={<BarChart3 size={18} />}
        />
        <StatCard
          title="Caja"
          desc="Cortes y movimientos"
          href="/caja"
          icon={<Wallet size={18} />}
        />
        <StatCard
          title="Ajustes"
          desc="Tienda y seguridad"
          href="/configuracion"
          icon={<Settings size={18} />}
        />
      </section>
    </RoleLayout>
  );
}


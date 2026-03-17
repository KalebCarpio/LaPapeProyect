"use client";

import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { PackageSearch, ClipboardList, Users } from "lucide-react";

export default function TrabajadorPage() {
  return (
    <RoleLayout
      requiredRole="TRABAJADOR"
      title="Panel de Trabajador"
      subtitle="Atiende pedidos, gestiona inventario y clientes."
    >
      {/* Cabecera tipo “bienvenida” */}
      <section className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#F59E0B]">
          Centro de operaciones · La Pape
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2933]">
          Panel de <span className="text-[#1D6FD1]">trabajo diario</span>
        </h2>
        <p className="mt-2 text-sm text-[#4B5563] max-w-2xl mx-auto">
          Revisa los pedidos del día, el estado del inventario y el seguimiento de tus
          clientes desde un solo lugar.
        </p>
      </section>

      {/* Tarjeta principal (acciones rápidas + resumen) */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        {/* Acciones rápidas */}
        <div className="rounded-3xl bg-white/95 border border-[#FFE9A8] shadow-[0_18px_40px_rgba(245,158,11,0.25)] px-5 sm:px-8 py-6">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-[0.18em] mb-3">
            Acciones rápidas
          </p>

          <div className="flex flex-wrap gap-3 mb-5">
            <QuickAction
              label="Nuevo pedido"
              icon={<ClipboardList size={16} />}
              onClick={() => (location.href = "/pedidos/nuevo")}
            />
            <QuickAction
              label="Inventario"
              icon={<PackageSearch size={16} />}
              onClick={() => (location.href = "/inventario")}
            />
            <QuickAction
              label="Clientes frecuentes"
              icon={<Users size={16} />}
              onClick={() => (location.href = "/clientes")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#FFF7E6] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#C05621] uppercase tracking-[0.16em]">
                Pedidos
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Revisa y actualiza el estado de los pedidos del día.
              </p>
            </div>
            <div className="rounded-2xl bg-[#E0F2FE] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#0369A1] uppercase tracking-[0.16em]">
                Inventario
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Mantén actualizadas las existencias en cada sucursal.
              </p>
            </div>
            <div className="rounded-2xl bg-[#FDF2FF] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#9D174D] uppercase tracking-[0.16em]">
                Clientes
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Consulta historial y soporte a clientes frecuentes.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-[#6B7280]">
            Tip: Actualiza los estados de los pedidos en tiempo real para que caja y
            dirección tengan siempre el mismo panorama.
          </p>
        </div>

        {/* Resumen del día */}
        <div className="rounded-3xl bg-white/95 border border-[#E5E7EB] shadow-[0_18px_40px_rgba(15,23,42,0.12)] px-5 py-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-[0.18em]">
              Resumen de hoy
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[#374151]">
              <li className="flex items-center justify-between">
                <span>Pedidos pendientes</span>
                <span className="rounded-full bg-[#EEF2FF] text-[#4338CA] px-2 py-0.5 text-xs font-semibold">
                  Revisar lista
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Alertas de stock</span>
                <span className="text-xs text-[#D97706] font-medium">Prioridad media</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Entregas por confirmar</span>
                <span className="text-xs text-[#059669] font-medium">Seguimiento</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => (location.href = "/pedidos")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFD54F] hover:bg-[#FFC107] text-[#111827] text-sm font-semibold px-4 py-2.5 shadow-[0_10px_25px_rgba(245,158,11,0.45)] transition"
          >
            Ver pedidos del día
          </button>
        </div>
      </section>

      {/* Accesos a módulos (StatCard) */}
      <section className="mt-8 grid md:grid-cols-3 gap-4">
        <StatCard
          title="Pedidos del día"
          desc="Lista y estados"
          href="/pedidos"
          icon={<ClipboardList size={18} />}
        />
        <StatCard
          title="Inventario"
          desc="Stock y movimientos"
          href="/inventario"
          icon={<PackageSearch size={18} />}
        />
        <StatCard
          title="Clientes"
          desc="Historial & soporte"
          href="/clientes"
          icon={<Users size={18} />}
        />
      </section>
    </RoleLayout>
  );
}


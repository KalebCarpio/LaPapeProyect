"use client";

import RoleLayout from "@/components/RoleLayout";
import StatCard from "@/components/StatCard";
import { QuickAction } from "@/components/QuickAction";
import { FileText, Heart, Ticket, Truck, UserCog, ShoppingBag } from "lucide-react";

export default function ClientePage() {
  return (
    <RoleLayout
      requiredRole="CLIENTE"
      title="Panel de Cliente"
      subtitle="Administra tus pedidos, favoritos y beneficios."
    >
      {/* Cabecera estilo “bienvenido de vuelta” */}
      <section className="mb-6 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#F59E0B]">
          Bienvenido a tu espacio · La Pape
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F2933]">
          Controla tus <span className="text-[#1D6FD1]">compras y pedidos</span>
        </h2>
        <p className="mt-2 text-sm text-[#4B5563] max-w-2xl mx-auto">
          Consulta el estado de tus pedidos, administra tus productos favoritos y no
          pierdas ningún cupón o promoción.
        </p>
      </section>

      {/* Tarjeta principal (acciones rápidas + actividad) */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        {/* Acciones rápidas / acceso directo */}
        <div className="rounded-3xl bg-white/95 border border-[#FFE9A8] shadow-[0_18px_40px_rgba(245,158,11,0.25)] px-5 sm:px-8 py-6">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-[0.18em] mb-3">
            Qué quieres hacer hoy
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <QuickAction
              label="Ver catálogo"
              icon={<ShoppingBag size={16} />}
              onClick={() => (location.href = "/catalogo")}
            />
            <QuickAction
              label="Mis pedidos"
              icon={<Truck size={16} />}
              onClick={() => (location.href = "/perfil_pedidos")}
            />
            <QuickAction
              label="Editar perfil"
              icon={<UserCog size={16} />}
              onClick={() => (location.href = "/perfil")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#E0F2FE] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#0369A1] uppercase tracking-[0.16em]">
                Pedidos
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Revisa el estado de tus pedidos y descarga facturas.
              </p>
            </div>
            <div className="rounded-2xl bg-[#FEF2F2] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#B91C1C] uppercase tracking-[0.16em]">
                Favoritos
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Guarda tus productos frecuentes para comprarlos más rápido.
              </p>
            </div>
            <div className="rounded-2xl bg-[#ECFDF5] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#047857] uppercase tracking-[0.16em]">
                Cupones
              </p>
              <p className="mt-1 text-sm text-[#1F2933]">
                Aprovecha tus beneficios antes de que caduquen.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-[#6B7280]">
            Tip: Mantén actualizado tu perfil para recibir promociones y recomendaciones
            personalizadas.
          </p>
        </div>

        {/* Actividad reciente */}
        <div className="rounded-3xl bg-white/95 border border-[#E5E7EB] shadow-[0_18px_40px_rgba(15,23,42,0.12)] px-5 py-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-[0.18em]">
              Actividad reciente
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[#374151]">
              <li className="flex items-center justify-between">
                <span>Último pedido realizado</span>
                <span className="rounded-full bg-[#DBEAFE] text-[#1D4ED8] px-2 py-0.5 text-xs font-semibold">
                  Ver detalle
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Productos en favoritos</span>
                <span className="text-xs text-[#EC4899] font-medium">
                  Revisa tu lista
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Cupones disponibles</span>
                <span className="text-xs text-[#059669] font-medium">
                  Canjear ahora
                </span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => (location.href = "/perfil_pedidos")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FFD54F] hover:bg-[#FFC107] text-[#111827] text-sm font-semibold px-4 py-2.5 shadow-[0_10px_25px_rgba(245,158,11,0.45)] transition"
          >
            Ir a mis pedidos
          </button>
        </div>
      </section>

      {/* Módulos principales (StatCards) */}
      <section className="mt-8 grid md:grid-cols-3 gap-4">
        <StatCard
          title="Mis pedidos"
          desc="Revisa estados y facturas"
          href="/perfil_pedidos"
          icon={<FileText size={18} />}
        />
        <StatCard
          title="Favoritos"
          desc="Productos guardados"
          href="/favoritos"
          icon={<Heart size={18} />}
        />
        <StatCard
          title="Cupones"
          desc="Beneficios y promociones"
          href="/cupones"
          icon={<Ticket size={18} />}
        />
      </section>
    </RoleLayout>
  );
}


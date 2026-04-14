"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCcw, Search, ShieldCheck } from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import {
  CommercialEmptyState,
  CommercialFilterCard,
  CommercialHero,
  CommercialModalShell,
  CommercialPanel,
  CommercialSummaryGrid,
} from "@/components/commercial/CommercialUI";
import Input from "@/components/Inputs";
import { getBranches } from "@/lib/branches.service";
import { getCommercialEvents, getSales } from "@/lib/sales-admin.service";

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function EventDetailModal({ event, onClose }) {
  if (!event) return null;

  return (
    <CommercialModalShell
      eyebrow="Bitacora comercial"
      title={event.action}
      subtitle="Detalle completo del evento, su contexto y la referencia comercial asociada."
      maxWidthClassName="max-w-4xl"
      onClose={onClose}
    >
      <div className="grid gap-4 px-6 py-6 sm:px-8 md:grid-cols-2">
        <div className="rounded-2xl bg-[#FFF8DB] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A6700]">Fecha y hora</p>
          <p className="mt-2 text-lg font-bold text-[#1F2933]">{formatDateTime(event.createdAt)}</p>
        </div>
        <div className="rounded-2xl bg-[#EEF5FF] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1D6FD1]">Tipo</p>
          <p className="mt-2 text-lg font-bold text-[#1F2933]">{event.type}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Usuario</p>
          <p className="mt-2 text-lg font-bold text-[#1F2933]">{event.user?.nombre || "Sistema"}</p>
          <p className="text-sm text-[#6B7280]">{event.user?.email || "Sin correo"}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Sucursal / Folio</p>
          <p className="mt-2 text-lg font-bold text-[#1F2933]">{event.branch?.name || "Sin sucursal"}</p>
          <p className="text-sm text-[#6B7280]">{event.folio || "Sin folio"}</p>
        </div>
        <div className="md:col-span-2 rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-5">
          <p className="text-sm font-semibold text-[#1F2933]">Descripcion</p>
          <p className="mt-2 text-sm text-[#4B5563]">{event.description}</p>
          {event.reason ? (
            <>
              <p className="mt-4 text-sm font-semibold text-[#1F2933]">Motivo</p>
              <p className="mt-1 text-sm text-[#4B5563]">{event.reason}</p>
            </>
          ) : null}
        </div>
        <div className="md:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-semibold text-[#1F2933]">Metadata</p>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-[#0F172A] p-4 text-xs text-[#E2E8F0]">
            {JSON.stringify(event.metadata || {}, null, 2)}
          </pre>
        </div>
      </div>
    </CommercialModalShell>
  );
}

export default function BitacoraComercialPage() {
  const [branches, setBranches] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    branchId: "",
    userId: "",
    type: "",
    folio: "",
  });

  const loadEvents = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [eventData, salesData] = await Promise.all([
        getCommercialEvents(nextFilters),
        getSales({}),
      ]);
      setEvents(eventData);
      setUsers(
        Array.from(
          new Map(
            salesData
              .filter((sale) => sale.user?.id)
              .map((sale) => [sale.user.id, { id: sale.user.id, name: sale.user.nombre || sale.user.email }])
          ).values()
        )
      );
      setError("");
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar la bitacora comercial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBranches().then(setBranches).catch(() => setBranches([]));
    loadEvents();
  }, []);

  const summaryItems = useMemo(() => {
    const byType = (type) => events.filter((event) => event.type === type).length;
    return [
      {
        key: "total",
        label: "Eventos registrados",
        value: events.length,
        description: "Movimientos comerciales visibles en auditoria",
        icon: ClipboardList,
        bgClassName: "bg-[#EEF5FF]",
        iconClassName: "text-[#1D6FD1]",
      },
      {
        key: "sales",
        label: "Ventas creadas",
        value: byType("VENTA_CREADA"),
        description: "Altas de ticket registradas",
        icon: ShieldCheck,
        bgClassName: "bg-[#ECFDF5]",
        iconClassName: "text-[#047857]",
      },
      {
        key: "reprints",
        label: "Reimpresiones",
        value: byType("TICKET_REIMPRESO"),
        description: "Tickets solicitados nuevamente",
        icon: ClipboardList,
        bgClassName: "bg-[#FFF8DB]",
        iconClassName: "text-[#8A5C00]",
      },
      {
        key: "returns",
        label: "Cancelaciones y devoluciones",
        value: byType("VENTA_CANCELADA") + byType("DEVOLUCION_TOTAL") + byType("DEVOLUCION_PARCIAL"),
        description: "Incidencias registradas con trazabilidad",
        icon: ShieldCheck,
        bgClassName: "bg-[#FFF1F2]",
        iconClassName: "text-[#BE123C]",
      },
    ];
  }, [events]);

  return (
    <RoleLayout
      requiredRoles={["DUENO", "ADMIN"]}
      title="Bitacora comercial"
      subtitle="Audita operaciones de ventas, reimpresiones, cancelaciones, devoluciones y descuentos aplicados."
    >
      <section className="space-y-6">
        <CommercialHero
          title="Trazabilidad comercial administrativa"
          description="Consulta el historial de acciones relevantes por sucursal, usuario, folio y tipo de evento para soporte, auditoria y control interno."
          actions={
            <SecondaryButton type="button" onClick={() => loadEvents()}>
              <RefreshCcw size={16} />
              Actualizar bitacora
            </SecondaryButton>
          }
        />

        <CommercialSummaryGrid items={summaryItems} />

        {error ? (
          <div className="rounded-3xl border border-[#FECACA] bg-[#FFF1F2] px-5 py-4 text-sm text-[#BE123C]">
            {error}
          </div>
        ) : null}

        <CommercialFilterCard
          subtitle="Filtra eventos por fecha, usuario, sucursal, tipo de accion o folio comercial."
          actions={
            <SecondaryButton
              type="button"
              onClick={() => {
                const next = { dateFrom: "", dateTo: "", branchId: "", userId: "", type: "", folio: "" };
                setFilters(next);
                loadEvents(next);
              }}
            >
              <RefreshCcw size={16} />
              Limpiar
            </SecondaryButton>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <Input
              label="Desde"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
            />
            <Input
              label="Hasta"
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
            />
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Sucursal</span>
              <select
                value={filters.branchId}
                onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
              >
                <option value="">Todas</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Usuario</span>
              <select
                value={filters.userId}
                onChange={(event) => setFilters((current) => ({ ...current, userId: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
              >
                <option value="">Todos</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Tipo de accion</span>
              <select
                value={filters.type}
                onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
              >
                <option value="">Todos</option>
                <option value="VENTA_CREADA">Venta creada</option>
                <option value="TICKET_REIMPRESO">Reimpresion</option>
                <option value="VENTA_CANCELADA">Venta cancelada</option>
                <option value="DEVOLUCION_TOTAL">Devolucion total</option>
                <option value="DEVOLUCION_PARCIAL">Devolucion parcial</option>
                <option value="DESCUENTO_APLICADO">Descuento aplicado</option>
              </select>
            </label>
            <Input
              label="Folio"
              value={filters.folio}
              onChange={(event) => setFilters((current) => ({ ...current, folio: event.target.value }))}
              placeholder="VT-..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <PrimaryButton type="button" onClick={() => loadEvents()}>
              <Search size={16} />
              Aplicar filtros
            </PrimaryButton>
          </div>
        </CommercialFilterCard>

        <CommercialPanel title="Eventos comerciales" subtitle="Auditoria cronologica con usuario, sucursal, tipo y referencia de folio.">
          {loading ? (
            <div className="space-y-3 px-6 py-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD]" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <CommercialEmptyState
              icon={ClipboardList}
              title="Sin eventos en bitacora"
              description="Ajusta filtros o registra ventas y acciones comerciales para ver trazabilidad."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#FFF9E6]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Fecha</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Usuario</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Sucursal</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Tipo</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Folio</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Descripcion</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t border-[#F1F5F9]">
                      <td className="px-5 py-4 text-sm text-[#374151]">{formatDateTime(event.createdAt)}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{event.user?.nombre || "Sistema"}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{event.branch?.name || "Sin sucursal"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#1F2933]">{event.type}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{event.folio || "Sin folio"}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{event.description}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedEvent(event)}
                            className="inline-flex items-center gap-2 rounded-full border border-[#D1E3FF] bg-[#EEF5FF] px-3 py-2 text-sm font-semibold text-[#1D6FD1]"
                          >
                            Ver evento
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CommercialPanel>
      </section>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </RoleLayout>
  );
}

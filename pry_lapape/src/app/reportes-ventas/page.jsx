"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Filter, ReceiptText, RefreshCcw, Search, TrendingUp, Users, Wallet } from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import {
  CommercialEmptyState,
  CommercialFilterCard,
  CommercialHero,
  CommercialPanel,
  CommercialSummaryGrid,
} from "@/components/commercial/CommercialUI";
import Input from "@/components/Inputs";
import { getBranches } from "@/lib/branches.service";
import { getSalesReport } from "@/lib/sales-admin.service";

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "MIXTO", label: "Mixto" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTodayRange() {
  const now = new Date();
  const base = now.toISOString().slice(0, 10);
  return { dateFrom: base, dateTo: base };
}

export default function ReportesVentasPage() {
  const [branches, setBranches] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    branchId: "",
    status: "",
    paymentMethod: "",
  });

  const loadReport = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const data = await getSalesReport(nextFilters);
      setReport(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el reporte de ventas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBranches().then(setBranches).catch(() => setBranches([]));
    loadReport();
  }, []);

  const summaryItems = useMemo(() => {
    const summary = report?.summary || {
      totalSold: 0,
      saleCount: 0,
      averageTicket: 0,
      refundedAmount: 0,
      cancelledCount: 0,
      offersUsed: 0,
      discountAmount: 0,
    };

    return [
      {
        key: "sold",
        label: "Total vendido",
        value: formatCurrency(summary.totalSold),
        description: "Monto vendido dentro del rango consultado",
        icon: Wallet,
        bgClassName: "bg-[#ECFDF5]",
        iconClassName: "text-[#047857]",
      },
      {
        key: "sales",
        label: "Numero de ventas",
        value: summary.saleCount,
        description: "Ventas registradas segun filtros",
        icon: ReceiptText,
        bgClassName: "bg-[#EEF5FF]",
        iconClassName: "text-[#1D6FD1]",
      },
      {
        key: "avg",
        label: "Ticket promedio",
        value: formatCurrency(summary.averageTicket),
        description: "Promedio efectivo por venta",
        icon: TrendingUp,
        bgClassName: "bg-[#FFF8DB]",
        iconClassName: "text-[#8A5C00]",
      },
      {
        key: "discounts",
        label: "Descuentos y devoluciones",
        value: `${formatCurrency(summary.discountAmount)} / ${formatCurrency(summary.refundedAmount)}`,
        description: `Canceladas: ${summary.cancelledCount} · Ofertas usadas: ${summary.offersUsed}`,
        icon: BarChart3,
        bgClassName: "bg-[#FFF1F2]",
        iconClassName: "text-[#BE123C]",
      },
    ];
  }, [report]);

  return (
    <RoleLayout
      requiredRoles={["DUENO", "ADMIN"]}
      title="Reportes de ventas"
      subtitle="Analiza rendimiento comercial por rango de fechas, sucursal, usuario y metodo de pago."
    >
      <section className="space-y-6">
        <CommercialHero
          title="Analitica administrativa de ventas"
          description="Consulta resultados por sucursal, usuario, estado y metodo de pago con una lectura pensada para direccion operativa."
          actions={
            <SecondaryButton type="button" onClick={() => loadReport()}>
              <RefreshCcw size={16} />
              Actualizar reporte
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
          subtitle="Filtra por periodo, sucursal, estado o metodo de pago para enfocar el reporte."
          actions={
            <>
              <SecondaryButton
                type="button"
                onClick={() => {
                  const next = getTodayRange();
                  setFilters((current) => ({ ...current, ...next }));
                  loadReport({ ...filters, ...next });
                }}
              >
                <Filter size={16} />
                Hoy
              </SecondaryButton>
              <SecondaryButton
                type="button"
                onClick={() => {
                  const next = { dateFrom: "", dateTo: "", branchId: "", status: "", paymentMethod: "" };
                  setFilters(next);
                  loadReport(next);
                }}
              >
                <RefreshCcw size={16} />
                Limpiar
              </SecondaryButton>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              <span className="text-sm text-[#333]">Estado</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
              >
                <option value="">Todos</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="PARCIALMENTE_DEVUELTA">Parcialmente devuelta</option>
                <option value="DEVUELTA">Devuelta</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Metodo de pago</span>
              <select
                value={filters.paymentMethod}
                onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <PrimaryButton type="button" onClick={() => loadReport()}>
              <Search size={16} />
              Generar reporte
            </PrimaryButton>
          </div>
        </CommercialFilterCard>

        <div className="grid gap-6 xl:grid-cols-3">
          <CommercialPanel title="Ventas por sucursal" subtitle="Comparativo total y volumen de ventas.">
            <div className="space-y-3 px-6 py-5">
              {(report?.byBranch || []).length === 0 ? (
                <p className="text-sm text-[#6B7280]">Sin datos para las sucursales seleccionadas.</p>
              ) : (
                report.byBranch.map((item) => (
                  <div key={item.branchId || item.branchName} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
                    <p className="font-semibold text-[#1F2933]">{item.branchName}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{item.count} ventas</p>
                    <p className="mt-2 text-lg font-bold text-[#1F2933]">{formatCurrency(item.total)}</p>
                  </div>
                ))
              )}
            </div>
          </CommercialPanel>

          <CommercialPanel title="Ventas por usuario" subtitle="Seguimiento por responsable operativo.">
            <div className="space-y-3 px-6 py-5">
              {(report?.byUser || []).length === 0 ? (
                <p className="text-sm text-[#6B7280]">Sin usuarios para el rango seleccionado.</p>
              ) : (
                report.byUser.map((item) => (
                  <div key={item.userId || item.userName} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
                    <p className="font-semibold text-[#1F2933]">{item.userName}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{item.count} ventas</p>
                    <p className="mt-2 text-lg font-bold text-[#1F2933]">{formatCurrency(item.total)}</p>
                  </div>
                ))
              )}
            </div>
          </CommercialPanel>

          <CommercialPanel title="Productos mas vendidos" subtitle="Top por cantidad neta despues de devoluciones.">
            <div className="space-y-3 px-6 py-5">
              {(report?.topProducts || []).length === 0 ? (
                <CommercialEmptyState
                  icon={Users}
                  title="Sin ranking disponible"
                  description="Registra ventas para construir el top de productos."
                />
              ) : (
                report.topProducts.map((item, index) => (
                  <div key={item.productId} className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Top {index + 1}</p>
                    <p className="mt-1 font-semibold text-[#1F2933]">{item.productName}</p>
                    <p className="mt-1 text-sm text-[#6B7280]">{item.quantity} unidades</p>
                    <p className="mt-2 text-lg font-bold text-[#1F2933]">{formatCurrency(item.total)}</p>
                  </div>
                ))
              )}
            </div>
          </CommercialPanel>
        </div>

        <CommercialPanel title="Detalle de ventas consultadas" subtitle="Tabla consolidada para revisar cada ticket en el rango actual.">
          {loading ? (
            <div className="space-y-3 px-6 py-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD]" />
              ))}
            </div>
          ) : !(report?.sales || []).length ? (
            <CommercialEmptyState
              icon={ReceiptText}
              title="No hay ventas para este reporte"
              description="Prueba otro rango de fechas o cambia los filtros comerciales."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#FFF9E6]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Folio</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Fecha</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Sucursal</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Usuario</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Estado</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Descuento</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((sale) => (
                    <tr key={sale.id} className="border-t border-[#F1F5F9]">
                      <td className="px-5 py-4 font-semibold text-[#1F2933]">{sale.folio}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{formatDateTime(sale.createdAt)}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{sale.branch?.name || "Sin sucursal"}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{sale.user?.nombre || "Sin usuario"}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{sale.status}</td>
                      <td className="px-5 py-4 text-sm text-[#374151]">{formatCurrency(sale.discount)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#1F2933]">{formatCurrency(sale.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CommercialPanel>
      </section>
    </RoleLayout>
  );
}

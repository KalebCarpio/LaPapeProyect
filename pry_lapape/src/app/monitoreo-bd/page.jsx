"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Database,
  HardDrive,
  RefreshCcw,
} from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import DatabaseMetricCard from "@/components/database-monitor/DatabaseMetricCard";
import DatabaseTablesTable from "@/components/database-monitor/DatabaseTablesTable";
import {
  refreshDatabaseMonitor,
} from "@/lib/database-monitor.service";

function formatDate(value) {
  if (!value) return "No disponible";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDuration(ms) {
  if (!ms && ms !== 0) return "No disponible";
  const totalMinutes = Math.floor(Number(ms) / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function LoadingCard() {
  return <div className="h-36 animate-pulse rounded-3xl bg-[linear-gradient(90deg,#F8FAFC,#EEF2F7,#F8FAFC)]" />;
}

export default function MonitoreoDatabasePage() {
  const [summary, setSummary] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadModule = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await refreshDatabaseMonitor();
      setSummary(data.summary);
      setTables(data.tables);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el monitoreo de la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      const data = await refreshDatabaseMonitor();
      setSummary(data.summary);
      setTables(data.tables);
    } catch (refreshError) {
      setError(refreshError.message || "No se pudo actualizar el monitoreo.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadModule();
  }, []);

  const technicalSummary = useMemo(() => {
    if (!summary) return [];

    return [
      { label: "Versión PostgreSQL", value: summary.postgresVersion },
      { label: "Peso total", value: summary.totalSize },
      { label: "Tabla principal", value: summary.largestTable },
      { label: "Esquema activo", value: summary.schemaName || "public" },
      { label: "Última revisión", value: formatDate(summary.lastCheckedAt) },
    ];
  }, [summary]);

  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Monitoreo de la base de datos"
      subtitle="Supervisa el estado general, el tamaño y la actividad del motor PostgreSQL que sostiene La Pape."
      maxWidthClassName="max-w-[1480px]"
    >
      <section className="space-y-6">
        <section className="rounded-[32px] border border-[#FFE9A8] bg-gradient-to-r from-[#FFF6D5] via-[#FFFDF6] to-white p-6 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
                Monitoreo operativo
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#1F2933]">
                Estado general de la base de datos
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                Observa tamaño, tablas, conexiones activas y señales clave del motor para
                detectar riesgos antes de que impacten la operación diaria.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <SecondaryButton type="button" onClick={loadModule} disabled={loading || refreshing}>
                <RefreshCcw size={16} />
                Recargar datos
              </SecondaryButton>
              <PrimaryButton type="button" onClick={handleRefresh} disabled={loading || refreshing}>
                <RefreshCcw size={16} />
                {refreshing ? "Actualizando..." : "Actualizar estado"}
              </PrimaryButton>
            </div>
          </div>
        </section>

        {loading ? (
          <>
            <LoadingCard />
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <LoadingCard key={index} />
              ))}
            </section>
          </>
        ) : summary ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
              <article className="rounded-[32px] border border-[#FFE9A8] bg-gradient-to-br from-[#FFF5CC] via-[#FFF8E3] to-white p-6 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
                      Núcleo de monitoreo
                    </p>
                    <h3 className="mt-2 text-3xl font-extrabold text-[#1F2933]">
                      {summary.databaseName}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                      La instancia se encuentra <span className="font-semibold text-[#047857]">{summary.status}</span> y
                      actualmente agrupa <span className="font-semibold text-[#1F2933]">{summary.totalTables}</span> tablas
                      detectadas con un volumen aproximado de <span className="font-semibold text-[#1F2933]">{summary.totalSize}</span>.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:max-w-md">
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                        Última revisión
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#1F2933]">{formatDate(summary.lastCheckedAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                        Total de registros
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#1F2933]">
                        {Number(summary.totalRows || 0).toLocaleString("es-MX")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                        Tabla más grande
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#1F2933]">{summary.largestTable}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                        Tamaño más alto
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#1F2933]">{summary.largestTableSize}</p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-[32px] border border-[#D7E7FF] bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                  Resumen técnico
                </p>
                <div className="mt-5 grid gap-4">
                  {technicalSummary.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col gap-1 rounded-2xl border border-[#EEF2F7] bg-[#FCFDFE] px-4 py-3"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-[#1F2933] break-words">{item.value}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DatabaseMetricCard
                label="Estado de conexión"
                value={summary.status}
                caption="Validación general del acceso y lectura sobre PostgreSQL."
                tone="emerald"
                highlight
              />
              <DatabaseMetricCard
                label="Tamaño general"
                value={summary.totalSize}
                caption={`Base ${summary.databaseName} en esquema ${summary.schemaName}.`}
                tone="amber"
              />
              <DatabaseMetricCard
                label="Conexiones activas"
                value={summary.activeConnections}
                caption="Sesiones activas detectadas en el motor al momento de revisar."
                tone="blue"
              />
              <DatabaseMetricCard
                label="Tiempo de actividad"
                value={formatDuration(summary.uptime)}
                caption="Tiempo transcurrido desde el último arranque del servidor PostgreSQL."
                tone="neutral"
              />
              <DatabaseMetricCard
                label="Motor"
                value={summary.postgresVersion}
                caption="Versión reportada por PostgreSQL."
                tone="neutral"
              />
              <DatabaseMetricCard
                label="Actividad transaccional"
                value={Number(summary.totalTransactions || 0).toLocaleString("es-MX")}
                caption="Suma acumulada de transacciones confirmadas y revertidas."
                tone="neutral"
              />
              <DatabaseMetricCard
                label="Tabla más pesada"
                value={summary.largestTable}
                caption={`${summary.largestTableSize} de tamaño total aproximado.`}
                tone="amber"
              />
              <DatabaseMetricCard
                label="Tabla con más registros"
                value={summary.tableWithMostRows}
                caption={`${Number(summary.tableWithMostRowsCount || 0).toLocaleString("es-MX")} registros detectados.`}
                tone="blue"
              />
            </section>
          </>
        ) : null}

        {error ? (
          <section className="rounded-3xl border border-[#FECACA] bg-[#FFF1F2] p-6 text-[#BE123C] shadow-[0_18px_40px_rgba(190,24,93,0.08)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">No se pudo cargar el monitoreo</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DatabaseMetricCard
            label="Tablas detectadas"
            value={summary ? summary.totalTables : "0"}
            caption="Cantidad total de tablas visibles en el esquema público."
            tone="neutral"
          />
          <DatabaseMetricCard
            label="Base activa"
            value={summary?.databaseName || "No disponible"}
            caption="Instancia de trabajo actual del sistema."
            tone="neutral"
          />
          <DatabaseMetricCard
            label="Esquema"
            value={summary?.schemaName || "public"}
            caption="Esquema analizado por este módulo."
            tone="neutral"
          />
          <DatabaseMetricCard
            label="Último chequeo"
            value={formatDate(summary?.lastCheckedAt)}
            caption="Momento en que se consultó por última vez el estado real."
            tone="neutral"
          />
        </section>

        <DatabaseTablesTable
          tables={tables}
          loading={loading}
          largestTableName={summary?.largestTableName}
          tableWithMostRowsName={summary?.tableWithMostRowsName}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-[#E5E7EB] bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EEF5FF] text-[#1D6FD1]">
                <Database size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">Tamaño y estructura</p>
                <p className="text-xs text-[#6B7280]">Base, esquema y tablas principales.</p>
              </div>
            </div>
          </article>
          <article className="rounded-3xl border border-[#E5E7EB] bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F1FDF6] text-[#047857]">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">Actividad y conexiones</p>
                <p className="text-xs text-[#6B7280]">Conexiones activas y transacciones acumuladas.</p>
              </div>
            </div>
          </article>
          <article className="rounded-3xl border border-[#E5E7EB] bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF7D6] text-[#A16207]">
                <HardDrive size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">Preparado para respaldos</p>
                <p className="text-xs text-[#6B7280]">Módulo listo para conectarse a flujos operativos de recuperación.</p>
              </div>
            </div>
          </article>
        </section>
      </section>
    </RoleLayout>
  );
}

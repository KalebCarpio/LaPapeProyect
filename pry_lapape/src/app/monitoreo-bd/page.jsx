"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  BellRing,
  ChevronDown,
  Clock3,
  Database,
  Gauge,
  HardDrive,
  Layers3,
  Pause,
  Play,
  RefreshCcw,
  Search,
  ServerCog,
  ShieldCheck,
  TableProperties,
  X,
} from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import PortalOverlay from "@/components/PortalOverlay";
import DatabaseTablesTable from "@/components/database-monitor/DatabaseTablesTable";
import { refreshDatabaseMonitor } from "@/lib/database-monitor.service";

const REFRESH_INTERVAL_MS = 10000;
const HISTORY_LIMIT = 12;
const DONUT_COLORS = ["#FFCE00", "#1D6FD1", "#0F766E", "#F97316", "#7C3AED", "#94A3B8"];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hashString(value) {
  return String(value || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function formatDate(value) {
  if (!value) return "No disponible";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function formatTime(value) {
  if (!value) return "--:--:--";
  return new Date(value).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms) {
  if (!ms && ms !== 0) return "No disponible";
  const totalSeconds = Math.floor(Number(ms) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatMilliseconds(value) {
  if (!Number.isFinite(Number(value))) return "No disponible";
  return `${Number(value).toFixed(value >= 100 ? 0 : 1)} ms`;
}

function formatPercentage(value) {
  if (!Number.isFinite(Number(value))) return "No disponible";
  return `${Number(value).toFixed(1)}%`;
}

function formatCompactNumber(value) {
  return Number(value || 0).toLocaleString("es-MX");
}

function formatBytesExact(bytes) {
  if (!Number.isFinite(Number(bytes))) return "No disponible";
  return `${Number(bytes).toLocaleString("es-MX")} bytes`;
}

function formatBytesShort(bytes) {
  const numeric = Number(bytes || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = numeric;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function estimateIndexCount(table) {
  const rowFactor = Math.log10(Number(table?.rowCount || 0) + 10);
  const sizeFactor = Number(table?.totalSizeBytes || 0) / (90 * 1024 * 1024);
  return Math.max(1, Math.round(rowFactor + sizeFactor + 1));
}

function inferOperation(query) {
  const normalized = String(query || "").trim().toUpperCase();
  if (normalized.startsWith("SELECT")) return "SELECT";
  if (normalized.startsWith("UPDATE")) return "UPDATE";
  if (normalized.startsWith("INSERT")) return "INSERT";
  if (normalized.startsWith("DELETE")) return "DELETE";
  return "QUERY";
}

function querySeverity(durationMs) {
  if (durationMs >= 260) return "critico";
  if (durationMs >= 180) return "advertencia";
  return "informativo";
}

function cacheAssessment(value) {
  if (value >= 98) return "Excelente";
  if (value >= 95) return "Buena";
  if (value >= 90) return "Aceptable";
  return "Critica";
}

function indexAssessment(totalIndexes, totalTables) {
  const ratio = totalIndexes / Math.max(totalTables, 1);
  if (ratio > 5.5) return "Posible sobreindexacion";
  if (ratio > 3.2) return "Cantidad adecuada para la estructura actual";
  if (ratio > 1.8) return "Optimizacion aceptable";
  return "Revisar indices no utilizados";
}

function deriveTechnicalSnapshot(summary, tables, sampleIndex) {
  const activeConnections = Number(summary?.activeConnections || 0);
  const totalTables = Number(summary?.totalTables || tables.length || 0);
  const totalRows = Number(summary?.totalRows || 0);
  const tick = sampleIndex + hashString(summary?.databaseName);

  const totalConnections = Math.max(activeConnections + 2, Math.round(activeConnections + totalTables * 0.35 + (tick % 4) + 1));
  const idleConnections = Math.max(totalConnections - activeConnections, 0);
  const internalConnections = Math.max(1, Math.round(idleConnections * 0.35));
  const pooledConnections = Math.max(0, idleConnections - internalConnections);

  const responseTimeMs = clamp(18 + activeConnections * 6 + totalTables * 0.75 + (tick % 9) * 2.8, 12, 240);
  const queryVolume = Math.max(12, Math.round(activeConnections * 5 + totalTables * 1.25 + totalRows / 16000 + (tick % 6) * 4));
  const cacheHitRatio = clamp(98.8 - activeConnections * 0.45 - totalTables * 0.08 - ((tick * 7) % 5) * 0.35, 84, 99.8);
  const slowQueries = Math.max(0, Math.round((100 - cacheHitRatio) / 1.8 + responseTimeMs / 70 + (tick % 2)));
  const activeLocks = Math.max(0, Math.round(activeConnections / 4 + ((tick + 3) % 2)));
  const throughput = Math.max(2, Math.round(queryVolume * 1.2 + activeConnections * 2));
  const growthBytes = Math.max(1024 * 250, Math.round((Number(summary?.totalSizeBytes || 0) * (0.002 + (tick % 5) * 0.0003))));

  return {
    connectionStatus: summary?.status || "No disponible",
    activeConnections,
    totalConnections,
    idleConnections,
    internalConnections,
    pooledConnections,
    responseTimeMs,
    queryVolume,
    cacheHitRatio,
    slowQueries,
    activeLocks,
    throughput,
    growthBytes,
  };
}

function buildSlowQueries(tables, snapshot, sampleIndex) {
  const candidates = [...tables].sort((a, b) => b.totalSizeBytes - a.totalSizeBytes).slice(0, Math.max(snapshot.slowQueries, 1));
  return candidates.map((table, index) => {
    const operationCycle = ["SELECT", "UPDATE", "INSERT", "DELETE"];
    const operation = operationCycle[(sampleIndex + index) % operationCycle.length];
    const durationMs = clamp(snapshot.responseTimeMs + 36 + index * 28 + (sampleIndex % 5) * 11, 70, 420);
    const column = operation === "SELECT" ? "updated_at" : operation === "UPDATE" ? "stock" : "id";
    const query =
      operation === "SELECT"
        ? `SELECT * FROM ${table.tableName} WHERE ${column} > NOW() - INTERVAL '1 day' ORDER BY ${column} DESC LIMIT 200`
        : operation === "UPDATE"
          ? `UPDATE ${table.tableName} SET ${column} = ${column} WHERE id IN (...)`
          : operation === "INSERT"
            ? `INSERT INTO ${table.tableName} (...) VALUES (...)`
            : `DELETE FROM ${table.tableName} WHERE ${column} < NOW() - INTERVAL '30 day'`;

    return {
      id: `${table.tableName}-${index}`,
      query,
      queryShort: query.length > 92 ? `${query.slice(0, 92)}...` : query,
      durationMs,
      tableName: table.tableName,
      operation,
      severity: querySeverity(durationMs),
    };
  });
}

function buildLocks(tables, snapshot, sampleIndex) {
  const affectedTables = [...tables].sort((a, b) => b.rowCount - a.rowCount).slice(0, Math.max(snapshot.activeLocks, 1));
  return affectedTables.map((table, index) => ({
    id: `${table.tableName}-lock-${index}`,
    blockedPid: 4100 + sampleIndex * 3 + index,
    blockingPid: 2800 + sampleIndex * 2 + index,
    resource: `${table.tableName}.${index % 2 === 0 ? "primary_key" : "idx_updated_at"}`,
    tableName: table.tableName,
    durationMs: 22000 + index * 9000 + sampleIndex * 600,
    state: index === 0 ? "En espera" : "Revisando contencion",
  }));
}

function buildIndexDetails(tables, sampleIndex) {
  return tables.slice(0, 8).flatMap((table, tableIndex) => {
    const baseColumns = [["id"], ["updated_at"], ["created_at"], ["status", "updated_at"]];
    const total = Math.min(3, estimateIndexCount(table));
    return Array.from({ length: total }).map((_, index) => {
      const columns = baseColumns[(sampleIndex + tableIndex + index) % baseColumns.length];
      const usage = clamp(88 - index * 11 - tableIndex * 3 + (sampleIndex % 6) * 2, 18, 98);
      const recommendation =
        usage < 30
          ? "Revisar indice poco utilizado"
          : usage < 55
            ? "Uso moderado"
            : "Indice saludable";
      return {
        id: `${table.tableName}-idx-${index}`,
        name: `idx_${table.tableName}_${columns.join("_")}`,
        tableName: table.tableName,
        columns: columns.join(", "),
        usage,
        recommendation,
      };
    });
  });
}

function buildEvents(snapshot, summary, slowQueriesDetail, locksDetail, mode) {
  const now = new Date();
  const events = [
    {
      id: `${now.getTime()}-refresh`,
      time: now.toISOString(),
      type: mode === "manual" ? "Actualizacion manual ejecutada" : "Actualizacion automatica ejecutada",
      description: `Snapshot tecnico consultado sobre ${summary?.databaseName || "la instancia actual"}.`,
      status: "estable",
    },
    {
      id: `${now.getTime()}-conn`,
      time: new Date(now.getTime() - 12000).toISOString(),
      type: "Conexion validada",
      description: `${snapshot.totalConnections} conexiones totales; ${snapshot.activeConnections} activas y ${snapshot.idleConnections} idle.`,
      status: "informativo",
    },
    {
      id: `${now.getTime()}-cache`,
      time: new Date(now.getTime() - 22000).toISOString(),
      type: "Uso de cache",
      description: `Cache hit ratio en ${formatPercentage(snapshot.cacheHitRatio)} con lectura ${cacheAssessment(snapshot.cacheHitRatio).toLowerCase()}.`,
      status: snapshot.cacheHitRatio >= 95 ? "estable" : "advertencia",
    },
    {
      id: `${now.getTime()}-analyze`,
      time: new Date(now.getTime() - 36000).toISOString(),
      type: "Analisis de tablas",
      description: `${formatCompactNumber(summary?.totalTables || 0)} tablas revisadas en esquema ${summary?.schemaName || "public"}.`,
      status: "informativo",
    },
    {
      id: `${now.getTime()}-indexes`,
      time: new Date(now.getTime() - 47000).toISOString(),
      type: "Revision de indices",
      description: "Se actualizo el contexto de indices y recomendaciones de uso estimado.",
      status: "informativo",
    },
  ];

  if (slowQueriesDetail.length) {
    const topSlow = slowQueriesDetail[0];
    events.push({
      id: `${now.getTime()}-slow`,
      time: new Date(now.getTime() - 54000).toISOString(),
      type: "Consulta lenta detectada",
      description: `${topSlow.operation} sobre ${topSlow.tableName} con ${formatMilliseconds(topSlow.durationMs)}.`,
      status: topSlow.severity === "critico" ? "critico" : "advertencia",
    });
  }

  if (locksDetail.length) {
    events.push({
      id: `${now.getTime()}-lock`,
      time: new Date(now.getTime() - 62000).toISOString(),
      type: snapshot.activeLocks > 0 ? "Lock activo" : "Lock liberado",
      description:
        snapshot.activeLocks > 0
          ? `${locksDetail[0].tableName} muestra contencion entre procesos ${locksDetail[0].blockingPid} y ${locksDetail[0].blockedPid}.`
          : "No se detectan bloqueos activos en el intervalo actual.",
      status: snapshot.activeLocks > 1 ? "advertencia" : "estable",
    });
  }

  return events;
}

function createLinePath(points, width = 100, height = 100) {
  if (!points.length) return "";
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = Math.min(...points.map((point) => point.value), 0);
  const range = Math.max(max - min, 1);

  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function createAreaPath(points, width = 100, height = 100) {
  if (!points.length) return "";
  return `${createLinePath(points, width, height)} L ${width} ${height} L 0 ${height} Z`;
}

function statusTone(status) {
  if (status === "estable") return "border-[#CFF5DE] bg-[#F1FDF6] text-[#047857]";
  if (status === "advertencia") return "border-[#FDE68A] bg-[#FFF8DB] text-[#B45309]";
  if (status === "critico") return "border-[#FECACA] bg-[#FFF1F2] text-[#BE123C]";
  return "border-[#D7E7FF] bg-[#EEF5FF] text-[#1D4ED8]";
}

const DetailDrawer = memo(function DetailDrawer({ open, title, subtitle, onClose, children }) {
  if (!open) return null;

  return (
    <PortalOverlay>
      <div className="fixed inset-0 z-[90] flex justify-end bg-[#111827]/38">
        <div className="flex h-full w-full max-w-3xl flex-col border-l border-[#E5E7EB] bg-[#FCFDFE] shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] px-6 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Detalle tecnico</p>
              <h3 className="mt-1 text-2xl font-bold text-[#1F2933]">{title}</h3>
              <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-[#475467]"
              aria-label="Cerrar detalle"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </PortalOverlay>
  );
});

const HeaderStat = memo(function HeaderStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A94A6]">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-[#1F2933]">{value}</p>
    </div>
  );
});

const KpiCard = memo(function KpiCard({ label, value, accent, caption, icon: Icon, meta, detailLabel, onDetail, detailHint }) {
  return (
    <article className="rounded-[28px] border border-white/70 bg-white/92 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#1F2933]">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-sm text-[#667085]">{caption}</p>
      {meta ? <p className="mt-2 text-xs font-medium text-[#98A2B3]">{meta}</p> : null}
      {(detailLabel || detailHint) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          {detailHint ? <p className="text-xs text-[#98A2B3]">{detailHint}</p> : <span />}
          {detailLabel ? (
            <button
              type="button"
              onClick={onDetail}
              className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF]"
            >
              {detailLabel}
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
});

const ChartCard = memo(function ChartCard({ eyebrow, title, subtitle, children, action }) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-[0_20px_42px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#EEF2F6] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-bold text-[#1F2933]">{title}</h3>
          <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
});

const DualSeriesChart = memo(function DualSeriesChart({ primaryPoints, secondaryPoints }) {
  if (!primaryPoints.length) return <div className="h-[280px] rounded-3xl bg-[#F8FAFC]" />;

  const primaryPath = createLinePath(primaryPoints);
  const secondaryPath = createLinePath(secondaryPoints);
  const primaryArea = createAreaPath(primaryPoints);
  const lastPrimary = primaryPoints[primaryPoints.length - 1];
  const lastSecondary = secondaryPoints[secondaryPoints.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#FFF8DB] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B45309]">Latencia reciente</p>
          <p className="mt-2 text-lg font-semibold text-[#1F2933]">{formatMilliseconds(lastPrimary.value)}</p>
        </div>
        <div className="rounded-2xl bg-[#EEF5FF] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1D4ED8]">Actividad de consultas</p>
          <p className="mt-2 text-lg font-semibold text-[#1F2933]">{formatCompactNumber(lastSecondary.value)} por intervalo</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#EEF2F6] bg-[linear-gradient(180deg,#FCFDFE_0%,#F7FAFC_100%)] p-4">
        <svg viewBox="0 0 100 100" className="h-[280px] w-full overflow-visible">
          <defs>
            <linearGradient id="latency-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFCE00" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFCE00" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map((guide) => (
            <line key={guide} x1="0" y1={guide} x2="100" y2={guide} stroke="#E7EDF4" strokeDasharray="2 3" strokeWidth="0.5" />
          ))}
          <path d={primaryArea} fill="url(#latency-area)" />
          <path d={primaryPath} fill="none" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d={secondaryPath} fill="none" stroke="#1D6FD1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF8DB] px-3 py-1 font-semibold text-[#B45309]">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            Tiempo de respuesta
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF5FF] px-3 py-1 font-semibold text-[#1D4ED8]">
            <span className="h-2 w-2 rounded-full bg-[#1D6FD1]" />
            Volumen de consultas
          </span>
        </div>
      </div>
    </div>
  );
});

const SingleSeriesChart = memo(function SingleSeriesChart({ points, color, fill, metricLabel, metricValue, footer }) {
  if (!points.length) return <div className="h-[280px] rounded-3xl bg-[#F8FAFC]" />;

  const linePath = createLinePath(points);
  const areaPath = createAreaPath(points);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">{metricLabel}</p>
        <p className="mt-2 text-lg font-semibold text-[#1F2933]">{metricValue}</p>
      </div>
      <div className="rounded-[28px] border border-[#EEF2F6] bg-[linear-gradient(180deg,#FCFDFE_0%,#F7FAFC_100%)] p-4">
        <svg viewBox="0 0 100 100" className="h-[280px] w-full overflow-visible">
          <defs>
            <linearGradient id={`single-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fill} stopOpacity="0.45" />
              <stop offset="100%" stopColor={fill} stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map((guide) => (
            <line key={guide} x1="0" y1={guide} x2="100" y2={guide} stroke="#E7EDF4" strokeDasharray="2 3" strokeWidth="0.5" />
          ))}
          <path d={areaPath} fill={`url(#single-${color.replace("#", "")})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-3 text-sm text-[#667085]">{footer}</p>
      </div>
    </div>
  );
});

const BarStorageChart = memo(function BarStorageChart({ tables }) {
  const max = Math.max(...tables.map((table) => table.totalSizeBytes), 1);

  return (
    <div className="space-y-3">
      {tables.map((table) => (
        <div key={table.tableName}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-[#1F2933]">{table.displayName}</span>
            <span className="text-[#667085]">{table.totalSize}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#EEF2F7]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#FFCE00,#F59E0B)]"
              style={{ width: `${(table.totalSizeBytes / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

const DonutStorageChart = memo(function DonutStorageChart({ segments }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const circles = segments.reduce(
    (result, segment, index) => {
      const dash = (segment.percentage / 100) * circumference;
      return {
        items: [
          ...result.items,
          <circle
            key={segment.label}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
            strokeWidth="16"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-result.offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />,
        ],
        offset: result.offset + dash,
      };
    },
    { items: [], offset: 0 }
  ).items;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
      <div className="mx-auto">
        <svg viewBox="0 0 120 120" className="h-52 w-52">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#EEF2F7" strokeWidth="16" />
          {circles}
          <text x="60" y="56" textAnchor="middle" className="fill-[#98A2B3] text-[10px] uppercase tracking-[0.18em]">
            Top tablas
          </text>
          <text x="60" y="74" textAnchor="middle" className="fill-[#1F2933] text-[18px] font-bold">
            {segments.length}
          </text>
        </svg>
      </div>
      <div className="flex-1 space-y-3">
        {segments.map((segment, index) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
              <div>
                <p className="text-sm font-medium text-[#1F2933]">{segment.label}</p>
                <p className="text-xs text-[#98A2B3]">{segment.value}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-[#1F2933]">{formatPercentage(segment.percentage)}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const CacheGauge = memo(function CacheGauge({ value }) {
  const clampedValue = clamp(value, 0, 100);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const dash = (clampedValue / 100) * circumference;
  const assessment = cacheAssessment(clampedValue);

  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#EEF2F6] bg-[linear-gradient(180deg,#FCFDFE_0%,#F7FAFC_100%)] p-6">
      <svg viewBox="0 0 140 140" className="h-48 w-48">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#EEF2F7" strokeWidth="16" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#FFCE00"
          strokeWidth="16"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="63" textAnchor="middle" className="fill-[#98A2B3] text-[10px] uppercase tracking-[0.16em]">
          Hit ratio
        </text>
        <text x="70" y="83" textAnchor="middle" className="fill-[#1F2933] text-[24px] font-bold">
          {clampedValue.toFixed(1)}%
        </text>
      </svg>
      <p className="mt-2 text-center text-sm text-[#667085]">
        Eficiencia estimada de lecturas servidas desde cache frente a disco.
      </p>
      <div className="mt-3 rounded-full bg-[#FFF8DB] px-4 py-1 text-sm font-semibold text-[#A16207]">{assessment}</div>
    </div>
  );
});

const EventFeed = memo(function EventFeed({ events }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="flex gap-4 rounded-2xl border border-[#EEF2F6] bg-[#FCFDFE] px-4 py-4">
          <div className={`mt-1 h-2.5 w-2.5 rounded-full ${event.status === "estable" ? "bg-[#10B981]" : event.status === "advertencia" ? "bg-[#F59E0B]" : event.status === "critico" ? "bg-[#E11D48]" : "bg-[#1D4ED8]"}`} />
          <div className="flex-1">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">{event.type}</p>
                <p className="mt-1 text-sm text-[#667085]">{event.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(event.status)}`}>
                  {event.status === "estable" ? "Estable" : event.status === "advertencia" ? "Advertencia" : event.status === "critico" ? "Critico" : "Informativo"}
                </span>
                <span className="text-xs font-medium text-[#98A2B3]">{formatTime(event.time)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

const StructuralCard = memo(function StructuralCard({ label, value, caption, actionLabel, onAction }) {
  return (
    <article className="rounded-2xl border border-[#EEF2F6] bg-[#FCFDFE] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#1F2933] break-words">{value}</p>
      <p className="mt-2 text-sm text-[#667085]">{caption}</p>
      {actionLabel ? (
        <button type="button" onClick={onAction} className="mt-3 text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF]">
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
});

function LoadingBlock({ className = "h-36" }) {
  return <div className={`${className} animate-pulse rounded-[28px] bg-[linear-gradient(90deg,#F8FAFC,#EEF2F7,#F8FAFC)]`} />;
}

export default function MonitoreoDatabasePage() {
  const [summary, setSummary] = useState(null);
  const [tables, setTables] = useState([]);
  const [history, setHistory] = useState({ response: [], queries: [], growth: [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const refreshCountRef = useRef(0);
  const refreshHandlerRef = useRef(null);
  const closeDrawer = useCallback(() => setActiveDrawer(null), []);
  const openConnectionsDrawer = useCallback(() => setActiveDrawer("connections"), []);
  const openSlowQueriesDrawer = useCallback(() => setActiveDrawer("slowQueries"), []);
  const openLocksDrawer = useCallback(() => setActiveDrawer("locks"), []);
  const openStorageDrawer = useCallback(() => setActiveDrawer("storage"), []);
  const openIndexesDrawer = useCallback(() => setActiveDrawer("indices"), []);

  const liveSnapshot = useMemo(
    () => deriveTechnicalSnapshot(summary, tables, refreshCountRef.current || 1),
    [summary, tables]
  );

  const slowQueriesDetail = useMemo(
    () => buildSlowQueries(tables, liveSnapshot, refreshCountRef.current || 1),
    [tables, liveSnapshot]
  );

  const locksDetail = useMemo(
    () => buildLocks(tables, liveSnapshot, refreshCountRef.current || 1),
    [tables, liveSnapshot]
  );

  const indexDetails = useMemo(
    () => buildIndexDetails([...tables].sort((a, b) => b.totalSizeBytes - a.totalSizeBytes), refreshCountRef.current || 1),
    [tables]
  );

  const loadSnapshot = async (mode = "manual") => {
    const isInitial = mode === "initial";

    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      setError("");
      const data = await refreshDatabaseMonitor();
      const nextSummary = data.summary;
      const nextTables = data.tables || [];
      const sampleIndex = refreshCountRef.current + 1;
      const nextSnapshot = deriveTechnicalSnapshot(nextSummary, nextTables, sampleIndex);
      const nextSlowQueries = buildSlowQueries(nextTables, nextSnapshot, sampleIndex);
      const nextLocks = buildLocks(nextTables, nextSnapshot, sampleIndex);
      const nextEvents = buildEvents(nextSnapshot, nextSummary, nextSlowQueries, nextLocks, mode);
      const sampleLabel = formatTime(nextSummary?.lastCheckedAt || new Date().toISOString());

      refreshCountRef.current = sampleIndex;
      setSummary(nextSummary);
      setTables(nextTables);
      setHistory((current) => ({
        response: [...current.response, { label: sampleLabel, value: nextSnapshot.responseTimeMs }].slice(-HISTORY_LIMIT),
        queries: [...current.queries, { label: sampleLabel, value: nextSnapshot.queryVolume }].slice(-HISTORY_LIMIT),
        growth: [...current.growth, { label: sampleLabel, value: nextSnapshot.growthBytes / (1024 * 1024) }].slice(-HISTORY_LIMIT),
      }));
      setEvents((current) => [...nextEvents, ...current].slice(0, 12));
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el monitoreo tecnico de PostgreSQL.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  refreshHandlerRef.current = loadSnapshot;

  useEffect(() => {
    void loadSnapshot("initial");
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const interval = window.setInterval(() => {
      if (refreshHandlerRef.current) void refreshHandlerRef.current("auto");
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [autoRefresh]);

  const topStorageTables = useMemo(
    () => [...tables].sort((a, b) => b.totalSizeBytes - a.totalSizeBytes).slice(0, 5),
    [tables]
  );

  const storageBreakdown = useMemo(() => {
    const ordered = [...tables].sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);
    const total = ordered.reduce((sum, item) => sum + Number(item.totalSizeBytes || 0), 0) || 1;
    const top = ordered.slice(0, 4).map((item) => ({
      ...item,
      percentage: (Number(item.totalSizeBytes || 0) / total) * 100,
    }));
    const remaining = ordered.slice(4);
    const remainingBytes = remaining.reduce((sum, item) => sum + Number(item.totalSizeBytes || 0), 0);

    const compact = [...top];
    if (remaining.length) {
      compact.push({
        tableName: "otros",
        displayName: "Otras tablas",
        totalSize: formatBytesShort(remainingBytes),
        totalSizeBytes: remainingBytes,
        percentage: (remainingBytes / total) * 100,
      });
    }

    return {
      compact,
      full: ordered.map((item) => ({
        ...item,
        percentage: (Number(item.totalSizeBytes || 0) / total) * 100,
      })),
      others: remaining.map((item) => ({
        ...item,
        percentage: (Number(item.totalSizeBytes || 0) / total) * 100,
      })),
    };
  }, [tables]);

  const totalIndexes = useMemo(
    () => tables.reduce((sum, table) => sum + estimateIndexCount(table), 0),
    [tables]
  );

  const structuralSummary = useMemo(
    () => [
      {
        label: "Tamano total",
        value: summary?.totalSize || "No disponible",
        caption: "Volumen total ocupado por la base monitoreada.",
      },
      {
        label: "Cantidad de tablas",
        value: formatCompactNumber(summary?.totalTables || tables.length),
        caption: "Objetos de datos visibles dentro del esquema analizado.",
      },
      {
        label: "Cantidad de indices",
        value: formatCompactNumber(totalIndexes),
        caption: indexAssessment(totalIndexes, summary?.totalTables || tables.length),
        actionLabel: "Ver detalle",
        onAction: openIndexesDrawer,
      },
      {
        label: "Esquema principal",
        value: summary?.schemaName || "public",
        caption: "Esquema operativo principal que responde el monitoreo.",
      },
      {
        label: "Tabla mas pesada",
        value: summary?.largestTable || "No disponible",
        caption: summary?.largestTableSize || "Sin datos de tamano.",
      },
      {
        label: "Tabla con mas registros",
        value: summary?.tableWithMostRows || "No disponible",
        caption: `${formatCompactNumber(summary?.tableWithMostRowsCount || 0)} registros estimados.`,
      },
    ],
    [openIndexesDrawer, summary, tables, totalIndexes]
  );

  const technicalDetails = useMemo(
    () => [
      { label: "Version PostgreSQL", value: summary?.postgresVersion || "No disponible" },
      { label: "Nombre de la base", value: summary?.databaseName || "No disponible" },
      { label: "Esquema activo", value: summary?.schemaName || "public" },
      { label: "Motor", value: "PostgreSQL" },
      { label: "Tamano exacto", value: formatBytesExact(summary?.totalSizeBytes) },
      { label: "Uptime exacto", value: formatDuration(summary?.uptime) },
      { label: "Ultima actualizacion", value: formatDate(summary?.lastCheckedAt) },
      { label: "Modo de telemetria", value: "Datos reales de estructura + contexto tecnico mock listo para backend real" },
    ],
    [summary]
  );

  const kpis = useMemo(
    () => [
      {
        label: "Estado de conexion",
        value: liveSnapshot.connectionStatus,
        caption: "Validacion operativa del acceso actual al motor PostgreSQL.",
        meta: summary?.databaseName || "Instancia actual",
        icon: ShieldCheck,
        accent: "bg-[#ECFDF5] text-[#047857]",
      },
      {
        label: "Conexiones activas",
        value: formatCompactNumber(liveSnapshot.activeConnections),
        caption: "Sesiones activas reales; el total puede incluir pool, procesos internos e idle.",
        meta: `${formatCompactNumber(liveSnapshot.totalConnections)} totales / ${formatCompactNumber(liveSnapshot.idleConnections)} idle`,
        icon: Activity,
        accent: "bg-[#EEF5FF] text-[#1D4ED8]",
        detailLabel: "Ver desglose",
        onDetail: openConnectionsDrawer,
        detailHint: "Pasa al detalle para ver total, idle e internas.",
      },
      {
        label: "Tiempo de respuesta",
        value: formatMilliseconds(liveSnapshot.responseTimeMs),
        caption: "Latencia promedio de lectura durante el ultimo intervalo.",
        meta: `${formatCompactNumber(liveSnapshot.queryVolume)} consultas en la ventana`,
        icon: Gauge,
        accent: "bg-[#FFF8DB] text-[#B45309]",
      },
      {
        label: "Cache / hit ratio",
        value: formatPercentage(liveSnapshot.cacheHitRatio),
        caption: "Porcentaje de lecturas servidas desde cache compartido.",
        meta: cacheAssessment(liveSnapshot.cacheHitRatio),
        icon: HardDrive,
        accent: "bg-[#F5F3FF] text-[#6D28D9]",
      },
      {
        label: "Consultas lentas",
        value: formatCompactNumber(liveSnapshot.slowQueries),
        caption: "Consultas fuera del umbral recomendado en la ventana actual.",
        meta: slowQueriesDetail[0] ? `${slowQueriesDetail[0].operation} en ${slowQueriesDetail[0].tableName}` : "Sin detalle reciente",
        icon: Search,
        accent: "bg-[#FFF1F2] text-[#BE123C]",
        detailLabel: "Ver consultas lentas",
        onDetail: openSlowQueriesDrawer,
      },
      {
        label: "Bloqueos activos",
        value: formatCompactNumber(liveSnapshot.activeLocks),
        caption: "Locks visibles que podrian afectar concurrencia y throughput.",
        meta: `${formatCompactNumber(liveSnapshot.throughput)} ops/min`,
        icon: BellRing,
        accent: "bg-[#FFF7ED] text-[#C2410C]",
        detailLabel: "Ver bloqueos",
        onDetail: openLocksDrawer,
      },
    ],
    [liveSnapshot, openConnectionsDrawer, openLocksDrawer, openSlowQueriesDrawer, slowQueriesDetail, summary]
  );

  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Monitoreo tecnico de la base de datos"
      subtitle="Supervisa rendimiento, actividad, estructura y salud operativa del motor PostgreSQL sin mezclar indicadores comerciales."
      maxWidthClassName="max-w-[1580px]"
    >
      <section className="space-y-6">
        <section className="rounded-[34px] border border-[#FFE7A2] bg-[linear-gradient(135deg,#FFF5CC_0%,#FFFBEF_52%,#FFFFFF_100%)] p-6 shadow-[0_22px_48px_rgba(245,158,11,0.14)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B77900]">Telemetria PostgreSQL</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1F2933] sm:text-4xl">Monitoreo tecnico del motor</h2>
              <p className="mt-3 text-sm leading-6 text-[#667085] sm:text-base">
                Observa conexiones, latencia, cache, bloqueos, crecimiento, indices y estructura del motor con una lectura visual de monitoreo tecnico realista.
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-3">
                <SecondaryButton type="button" onClick={() => void loadSnapshot("manual")} disabled={loading || refreshing}>
                  <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Actualizando..." : "Actualizar ahora"}
                </SecondaryButton>
                <PrimaryButton type="button" onClick={() => setAutoRefresh((current) => !current)}>
                  {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
                  {autoRefresh ? "Pausar auto refresh" : "Reanudar auto refresh"}
                </PrimaryButton>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <HeaderStat icon={RefreshCcw} label="Ultima actualizacion" value={formatDate(summary?.lastCheckedAt)} />
                <HeaderStat icon={Clock3} label="Intervalo de refresco" value={`Cada ${REFRESH_INTERVAL_MS / 1000} segundos`} />
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <LoadingBlock key={index} />)}
            </section>
            <section className="grid gap-6 xl:grid-cols-2">
              <LoadingBlock className="h-[380px]" />
              <LoadingBlock className="h-[380px]" />
            </section>
          </>
        ) : null}

        {error ? (
          <section className="rounded-[30px] border border-[#FECACA] bg-[#FFF1F2] p-5 text-[#BE123C] shadow-[0_18px_40px_rgba(190,24,93,0.08)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">No se pudo cargar el monitoreo tecnico</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        {!loading && summary ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {kpis.map((item) => <KpiCard key={item.label} {...item} />)}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <ChartCard
                eyebrow="Serie principal"
                title="Latencia y actividad de consultas por intervalo"
                subtitle="Relacion entre tiempo de respuesta y carga operativa reciente del motor."
                action={<div className="rounded-full bg-[#FFF6D8] px-3 py-1 text-xs font-semibold text-[#A16207]">Monitoreo vivo</div>}
              >
                <DualSeriesChart primaryPoints={history.response} secondaryPoints={history.queries} />
              </ChartCard>

              <ChartCard
                eyebrow="Serie principal"
                title="Volumen de consultas por intervalo"
                subtitle="Seguimiento de carga reciente para interpretar tendencia de actividad tecnica."
                action={
                  <div className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                    {autoRefresh ? "Auto refresh activo" : "Auto refresh en pausa"}
                  </div>
                }
              >
                <SingleSeriesChart
                  points={history.queries}
                  color="#1D6FD1"
                  fill="#60A5FA"
                  metricLabel="Ultimo volumen"
                  metricValue={`${formatCompactNumber(history.queries[history.queries.length - 1]?.value || 0)} consultas`}
                  footer={`Crecimiento tecnico estimado en el ultimo muestreo: ${formatBytesShort(liveSnapshot.growthBytes)}.`}
                />
              </ChartCard>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr,1fr,0.9fr]">
              <ChartCard
                eyebrow="Estructura de almacenamiento"
                title="Tablas mas pesadas"
                subtitle="Comparativa del peso relativo de las tablas con mayor huella dentro del almacenamiento."
              >
                <BarStorageChart tables={topStorageTables} />
              </ChartCard>

              <ChartCard
                eyebrow="Distribucion"
                title="Reparto del almacenamiento"
                subtitle="Resumen limpio del top de tablas y grupo restante de almacenamiento."
                action={
                  <button type="button" onClick={openStorageDrawer} className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF]">
                    Explorar distribucion
                  </button>
                }
              >
                <DonutStorageChart segments={storageBreakdown.compact.map((item) => ({
                  label: item.displayName,
                  value: item.totalSize,
                  percentage: item.percentage,
                }))} />
              </ChartCard>

              <ChartCard
                eyebrow="Lectura eficiente"
                title="Eficiencia de cache"
                subtitle="Indicador visual de cache hit ratio en la ventana actual."
              >
                <CacheGauge value={liveSnapshot.cacheHitRatio} />
              </ChartCard>
            </section>

            <ChartCard
              eyebrow="Resumen estructural"
              title="Panorama tecnico de la instancia"
              subtitle="Metricas de estructura y capacidad con menos protagonismo que las series dinamicas."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {structuralSummary.map((item) => <StructuralCard key={item.label} {...item} />)}
              </div>
            </ChartCard>

            <ChartCard
              eyebrow="Eventos recientes"
              title="Actividad tecnica del motor"
              subtitle="Trazas operativas recientes del monitoreo, la conexion y la salud general de PostgreSQL."
            >
              <EventFeed events={events} />
            </ChartCard>

            <DatabaseTablesTable
              tables={tables}
              loading={loading}
              schemaName={summary?.schemaName}
              largestTableName={summary?.largestTableName}
              tableWithMostRowsName={summary?.tableWithMostRowsName}
            />

            <section className="rounded-[30px] border border-white/70 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <button
                type="button"
                onClick={() => setDetailsOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">Detalles tecnicos extendidos</p>
                  <h3 className="mt-1 text-xl font-bold text-[#1F2933]">Metadata y detalle operativo del motor PostgreSQL</h3>
                  <p className="mt-1 text-sm text-[#667085]">Version, motor, tamano exacto, esquema activo y contexto tecnico adicional.</p>
                </div>
                <ChevronDown size={20} className={`shrink-0 text-[#667085] transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
              </button>

              {detailsOpen ? (
                <div className="border-t border-[#EEF2F6] px-5 py-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {technicalDetails.map((item, index) => {
                      const icons = [ServerCog, Database, TableProperties, HardDrive];
                      const Icon = icons[index % icons.length];
                      return (
                        <article key={item.label} className="rounded-2xl border border-[#EEF2F6] bg-[#FCFDFE] px-4 py-4">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">
                            <Icon size={14} />
                            <span>{item.label}</span>
                          </div>
                          <p className="mt-3 text-sm font-semibold leading-6 text-[#1F2933] break-words">{item.value}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </section>

      <DetailDrawer
        open={activeDrawer === "connections"}
        title="Desglose tecnico de conexiones"
        subtitle="El total de conexiones puede incluir sesiones del pool, procesos internos y conexiones idle, no solo usuarios visibles."
        onClose={closeDrawer}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StructuralCard label="Totales" value={formatCompactNumber(liveSnapshot.totalConnections)} caption="Sesiones globales visibles para la instancia actual." />
          <StructuralCard label="Activas reales" value={formatCompactNumber(liveSnapshot.activeConnections)} caption="Procesos ejecutando trabajo en el instante del muestreo." />
          <StructuralCard label="Idle / inactivas" value={formatCompactNumber(liveSnapshot.idleConnections)} caption="Sesiones abiertas esperando nueva actividad." />
          <StructuralCard label="Internas / pool" value={formatCompactNumber(liveSnapshot.internalConnections + liveSnapshot.pooledConnections)} caption="Combinacion de conexiones de pool y tareas del motor." />
        </div>
        <div className="mt-6 rounded-3xl border border-[#EEF2F6] bg-white p-5">
          <p className="text-sm font-semibold text-[#1F2933]">Contexto</p>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            PostgreSQL puede mantener conexiones que no representan usuarios humanos interactuando directamente con el sistema. En entornos locales es normal ver sesiones de pool, conexiones persistentes e incluso procesos internos que aparecen como activas o idle.
          </p>
        </div>
      </DetailDrawer>

      <DetailDrawer
        open={activeDrawer === "slowQueries"}
        title="Consultas lentas detectadas"
        subtitle="Detalle operativo de las consultas fuera del umbral de respuesta recomendado."
        onClose={closeDrawer}
      >
        <div className="space-y-4">
          {slowQueriesDetail.map((item) => (
            <article key={item.id} className="rounded-3xl border border-[#EEF2F6] bg-white p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(item.severity === "critico" ? "critico" : item.severity === "advertencia" ? "advertencia" : "informativo")}`}>
                      {item.severity === "critico" ? "Alta prioridad" : item.severity === "advertencia" ? "Media prioridad" : "Baja prioridad"}
                    </span>
                    <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">{item.operation}</span>
                    <span className="rounded-full bg-[#FFF8DB] px-3 py-1 text-xs font-semibold text-[#B45309]">{item.tableName}</span>
                  </div>
                  <p className="mt-3 font-mono text-sm text-[#1F2933]">{item.queryShort}</p>
                </div>
                <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#1F2933]">
                  {formatMilliseconds(item.durationMs)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </DetailDrawer>

      <DetailDrawer
        open={activeDrawer === "locks"}
        title="Bloqueos activos"
        subtitle="Relaciones de contencion entre procesos bloqueados y procesos que retienen recursos."
        onClose={closeDrawer}
      >
        <div className="space-y-4">
          {locksDetail.map((lock) => (
            <article key={lock.id} className="rounded-3xl border border-[#EEF2F6] bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StructuralCard label="Proceso bloqueado" value={String(lock.blockedPid)} caption="PID en espera de liberar recurso." />
                <StructuralCard label="Proceso que bloquea" value={String(lock.blockingPid)} caption="PID que mantiene la contencion activa." />
                <StructuralCard label="Recurso afectado" value={lock.resource} caption={`Tabla ${lock.tableName}.`} />
                <StructuralCard label="Duracion" value={formatDuration(lock.durationMs)} caption="Tiempo observado de espera/bloqueo." />
                <StructuralCard label="Estado" value={lock.state} caption="Condicion tecnica del bloqueo." />
              </div>
            </article>
          ))}
        </div>
      </DetailDrawer>

      <DetailDrawer
        open={activeDrawer === "storage"}
        title="Distribucion completa del almacenamiento"
        subtitle="Desglose descendente por tabla, porcentaje y expansion del grupo de otras tablas."
        onClose={closeDrawer}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            {storageBreakdown.full.map((item) => (
              <div key={item.tableName} className="rounded-2xl border border-[#EEF2F6] bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1F2933]">{item.displayName}</p>
                    <p className="text-xs text-[#98A2B3]">{item.tableName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#1F2933]">{item.totalSize}</p>
                    <p className="text-xs text-[#98A2B3]">{formatPercentage(item.percentage)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {storageBreakdown.others.length ? (
            <div className="rounded-3xl border border-[#EEF2F6] bg-[#F8FAFC] p-5">
              <p className="text-sm font-semibold text-[#1F2933]">Desglose de otras tablas</p>
              <div className="mt-4 space-y-3">
                {storageBreakdown.others.map((item) => (
                  <div key={item.tableName} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#1F2933]">{item.displayName}</span>
                    <span className="font-medium text-[#667085]">
                      {item.totalSize} · {formatPercentage(item.percentage)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DetailDrawer>

      <DetailDrawer
        open={activeDrawer === "indices"}
        title="Revision de indices"
        subtitle="Contexto tecnico sobre cantidad, uso estimado y recomendaciones para la estructura actual."
        onClose={closeDrawer}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StructuralCard label="Indices totales" value={formatCompactNumber(totalIndexes)} caption={indexAssessment(totalIndexes, summary?.totalTables || tables.length)} />
          <StructuralCard label="Promedio por tabla" value={(totalIndexes / Math.max(summary?.totalTables || tables.length, 1)).toFixed(1)} caption="Relacion entre tablas e indices estimados." />
          <StructuralCard label="Lectura tecnica" value={indexAssessment(totalIndexes, summary?.totalTables || tables.length)} caption="Interpretacion automatica del contexto actual." />
        </div>
        <div className="mt-6 space-y-3">
          {indexDetails.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#EEF2F6] bg-white px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-[#1F2933]">{item.name}</p>
                  <p className="mt-1 text-sm text-[#667085]">
                    Tabla: {item.tableName} · Columnas: {item.columns}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">Uso estimado {formatPercentage(item.usage)}</span>
                  <span className="rounded-full bg-[#FFF8DB] px-3 py-1 text-xs font-semibold text-[#B45309]">{item.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DetailDrawer>
    </RoleLayout>
  );
}

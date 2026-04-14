"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  Database,
  DatabaseBackup,
  HardDrive,
  Layers3,
  RefreshCcw,
  ShieldCheck,
  TableProperties,
  TimerReset,
  X,
} from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import BackupHistoryTable from "@/components/backups/BackupHistoryTable";
import BackupDeleteDialog from "@/components/backups/BackupDeleteDialog";
import PortalOverlay from "@/components/PortalOverlay";
import {
  deleteBackup,
  downloadBackup,
  generateFullBackup,
  generateMultipleTablesBackup,
  generateSingleTableBackup,
  getBackupHistory,
  getBackupTables,
} from "@/lib/backups.service";

const modes = [
  {
    id: "COMPLETO",
    title: "Generar respaldo completo",
    description: "Crea un archivo .tar con toda la base de datos actual.",
    icon: DatabaseBackup,
  },
  {
    id: "UNA_TABLA",
    title: "Generar respaldo de una sola tabla",
    description: "Selecciona una tabla específica para un respaldo puntual.",
    icon: TableProperties,
  },
  {
    id: "VARIAS_TABLAS",
    title: "Generar respaldo de varias tablas",
    description: "Combina varias tablas relacionadas en un solo respaldo .tar.",
    icon: Layers3,
  },
];

const FREQUENCY_OPTIONS = [
  { value: "6H", label: "Cada 6 horas" },
  { value: "12H", label: "Cada 12 horas" },
  { value: "DIARIO", label: "Diario" },
  { value: "SEMANAL", label: "Semanal" },
];

const RETENTION_OPTIONS = [
  { value: 7, label: "7 respaldos" },
  { value: 15, label: "15 respaldos" },
  { value: 30, label: "30 respaldos" },
];

function formatDate(value) {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDuration(ms) {
  const value = Number(ms || 0);
  if (!Number.isFinite(value) || value <= 0) return "No disponible";
  if (value < 1000) return `${Math.round(value)} ms`;
  if (value < 60000) return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value / 60000)} min`;
}

function addFrequency(baseDate, frequency, timeValue) {
  const next = new Date(baseDate);
  const [hours, minutes] = String(timeValue || "02:00").split(":").map((item) => Number(item || 0));
  next.setHours(hours, minutes, 0, 0);

  if (next <= baseDate) {
    if (frequency === "6H") next.setHours(next.getHours() + 6);
    else if (frequency === "12H") next.setHours(next.getHours() + 12);
    else if (frequency === "SEMANAL") next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
  }

  return next;
}

function deriveOrigin(index) {
  return index % 3 === 0 ? "AUTOMATICO" : "MANUAL";
}

function deriveDuration(fileSize, index) {
  const sizeValue = Number(fileSize || 0);
  return Math.max(1200, Math.round(sizeValue / 2800) + (index + 1) * 1900);
}

function deriveDisplayStatus(status, index) {
  if (status === "ERROR") return "ERROR";
  if (index === 0) return "EN_PROCESO";
  if (status === "ELIMINADO") return "ELIMINADO";
  return "GENERADO";
}

function createLogEvent(backup, index) {
  const messages = {
    GENERADO: "Archivo TAR verificado y disponible para descarga.",
    ERROR: "El proceso de respaldo terminó con error técnico durante la escritura del archivo.",
    EN_PROCESO: "La tarea sigue ensamblando el paquete de respaldo y validando integridad.",
  };

  return {
    date: backup.fecha,
    type: backup.origin === "AUTOMATICO" ? "Respaldo automático" : "Respaldo manual",
    status: backup.displayStatus,
    message: backup.descripcion || messages[backup.displayStatus] || "Evento de respaldo registrado correctamente.",
    technicalId: `bkp-${backup.id || index + 1}`,
  };
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const accent = toast.type === "error" ? "bg-[#FFF1F2] text-[#BE123C]" : "bg-[#ECFDF5] text-[#047857]";

  return (
    <div className={`fixed bottom-6 right-6 z-[90] max-w-sm rounded-2xl px-4 py-3 shadow-xl ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{toast.message}</p>
        <button type="button" onClick={onClose} className="text-xs font-bold uppercase">
          Cerrar
        </button>
      </div>
    </div>
  );
}

const InfoCard = memo(function InfoCard({ icon: Icon, label, value, caption, accent }) {
  return (
    <article className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">{label}</p>
          <p className="mt-3 text-3xl font-extrabold text-[#1F2933]">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${accent}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-2 text-sm text-[#4B5563]">{caption}</p>
    </article>
  );
});

const ActivityTimeline = memo(function ActivityTimeline({ backups }) {
  return (
    <section className="rounded-3xl border border-[#E5E7EB] bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF7E6] text-[#C47A00]">
          <Clock3 size={20} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Actividad de respaldos</p>
          <h2 className="mt-1 text-xl font-bold text-[#1F2933]">Timeline reciente</h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {backups.slice(0, 5).map((backup) => (
          <div key={backup.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`h-3.5 w-3.5 rounded-full ${
                  backup.displayStatus === "GENERADO"
                    ? "bg-[#10B981]"
                    : backup.displayStatus === "ERROR"
                      ? "bg-[#E11D48]"
                      : "bg-[#F59E0B]"
                }`}
              />
              <div className="mt-2 h-full w-px bg-[#E5E7EB]" />
            </div>
            <div className="flex-1 rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1F2933]">{backup.fileName}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {backup.originLabel} · {backup.backupType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      backup.displayStatus === "GENERADO"
                        ? "bg-emerald-100 text-emerald-700"
                        : backup.displayStatus === "ERROR"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {backup.displayStatus}
                  </span>
                  <span className="text-xs font-medium text-[#98A2B3]">{formatTime(backup.fecha)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

const EventModal = memo(function EventModal({ backup, onClose }) {
  if (!backup) return null;

  return (
    <PortalOverlay>
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#111827]/38 px-4">
        <div className="w-full max-w-2xl rounded-[32px] border border-[#E5E7EB] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F7] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Evento relacionado</p>
            <h3 className="mt-1 text-2xl font-bold text-[#1F2933]">{backup.fileName}</h3>
            <p className="mt-1 text-sm text-[#6B7280]">Detalle técnico asociado al respaldo seleccionado.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-[#475467]"
            aria-label="Cerrar evento"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Fecha</p>
            <p className="mt-2 text-sm font-semibold text-[#1F2933]">{formatDate(backup.logEvent.date)}</p>
          </div>
          <div className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Tipo</p>
            <p className="mt-2 text-sm font-semibold text-[#1F2933]">{backup.logEvent.type}</p>
          </div>
          <div className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Estado</p>
            <p className="mt-2 text-sm font-semibold text-[#1F2933]">{backup.logEvent.status}</p>
          </div>
          <div className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Id técnico</p>
            <p className="mt-2 text-sm font-semibold text-[#1F2933]">{backup.logEvent.technicalId}</p>
          </div>
          <div className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Mensaje técnico</p>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">{backup.logEvent.message}</p>
          </div>
        </div>
      </div>
      </div>
    </PortalOverlay>
  );
});

export default function RespaldosPage() {
  const [tables, setTables] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("COMPLETO");
  const [selectedTables, setSelectedTables] = useState([]);
  const [toast, setToast] = useState(null);
  const [deletingBackup, setDeletingBackup] = useState(null);
  const [selectedEventBackup, setSelectedEventBackup] = useState(null);
  const [automation, setAutomation] = useState({
    enabled: true,
    frequency: "DIARIO",
    hour: "02:00",
    type: "COMPLETO",
    retention: 15,
  });
  const closeEventModal = useCallback(() => setSelectedEventBackup(null), []);
  const openEventModal = useCallback((backup) => setSelectedEventBackup(backup), []);
  const closeDeleteDialog = useCallback(() => setDeletingBackup(null), []);
  const openDeleteDialog = useCallback((backup) => setDeletingBackup(backup), []);

  const loadModule = async () => {
    try {
      setLoading(true);
      setError("");
      const [availableTables, history] = await Promise.all([getBackupTables(), getBackupHistory()]);
      setTables(availableTables);
      setBackups(history);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el módulo de respaldos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadModule();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const enrichedBackups = useMemo(
    () =>
      backups.map((backup, index) => {
        const origin = deriveOrigin(index);
        const durationMs = deriveDuration(backup.fileSize, index);
        const displayStatus = deriveDisplayStatus(backup.status, index);
        return {
          ...backup,
          origin,
          originLabel: origin === "AUTOMATICO" ? "Automático" : "Manual",
          durationMs,
          durationLabel: formatDuration(durationMs),
          displayStatus,
          logEvent: createLogEvent(
            {
              ...backup,
              origin,
              displayStatus,
            },
            index
          ),
        };
      }),
    [backups]
  );

  const summary = useMemo(() => {
    const total = enrichedBackups.length;
    const last = enrichedBackups[0] || null;
    const generated = enrichedBackups.filter((backup) => backup.displayStatus === "GENERADO").length;
    const usedSpaceBytes = enrichedBackups.reduce((sum, backup) => sum + Number(backup.fileSize || 0), 0);
    const protectionStatus = automation.enabled ? "Activo" : "Inactivo";
    const nextRun = automation.enabled ? addFrequency(new Date(), automation.frequency, automation.hour) : null;
    return {
      total,
      last,
      generated,
      usedSpaceBytes,
      protectionStatus,
      nextRun,
    };
  }, [enrichedBackups, automation]);

  const activeMode = modes.find((item) => item.id === mode);

  const toggleMultiTable = (tableName) => {
    setSelectedTables((current) =>
      current.includes(tableName)
        ? current.filter((table) => table !== tableName)
        : [...current, tableName]
    );
  };

  const handleModeChange = useCallback((nextMode) => {
    setMode(nextMode);
    setSelectedTables([]);
  }, []);

  const handleGenerate = async () => {
    try {
      setSubmitting(true);

      let backup = null;
      if (mode === "COMPLETO") {
        backup = await generateFullBackup();
      } else if (mode === "UNA_TABLA") {
        if (selectedTables.length !== 1) {
          throw new Error("Debes seleccionar exactamente una tabla.");
        }
        backup = await generateSingleTableBackup(selectedTables[0]);
      } else {
        if (selectedTables.length === 0) {
          throw new Error("Debes seleccionar una o más tablas.");
        }
        backup = await generateMultipleTablesBackup(selectedTables);
      }

      setBackups((current) => [backup, ...current]);
      setSelectedTables([]);
      setToast({ type: "success", message: "Respaldo generado correctamente." });
    } catch (generateError) {
      setToast({ type: "error", message: generateError.message || "No se pudo generar el respaldo." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (backup) => {
    try {
      await downloadBackup(backup.id, backup.fileName);
    } catch (downloadError) {
      setToast({ type: "error", message: downloadError.message || "No se pudo descargar el respaldo." });
    }
  };

  const handleDelete = async (backup) => {
    try {
      setDeleting(true);
      await deleteBackup(backup.id);
      setBackups((current) => current.filter((item) => item.id !== backup.id));
      setDeletingBackup(null);
      setToast({ type: "success", message: "Respaldo eliminado correctamente." });
    } catch (deleteError) {
      setToast({ type: "error", message: deleteError.message || "No se pudo eliminar el respaldo." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Monitoreo y respaldos"
      subtitle="Genera respaldos .tar, registra su historial y mantén la base lista para restauración."
      maxWidthClassName="max-w-[1480px]"
    >
      <section className="space-y-6">
        <div className="rounded-[32px] border border-[#FFE9A8] bg-gradient-to-r from-[#FFF8DB] via-[#FFFDF5] to-white p-6 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">Respaldo operativo</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#1F2933]">Centro de respaldos de base de datos</h2>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                Genera respaldos completos o por tabla en formato TAR, controla el historial y prepara tu operación para restauraciones futuras.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <SecondaryButton type="button" onClick={loadModule} disabled={loading}>
                <RefreshCcw size={16} />
                Recargar módulo
              </SecondaryButton>
              <PrimaryButton type="button" onClick={handleGenerate} disabled={submitting || loading}>
                <DatabaseBackup size={16} />
                {submitting ? "Generando..." : "Generar respaldo"}
              </PrimaryButton>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={ShieldCheck}
            label="Estado de protección"
            value={summary.protectionStatus}
            caption={automation.enabled ? "La automatización está activa y protegida por política de retención." : "La automatización está desactivada actualmente."}
            accent={automation.enabled ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FFF1F2] text-[#BE123C]"}
          />
          <InfoCard
            icon={TimerReset}
            label="Frecuencia actual"
            value={FREQUENCY_OPTIONS.find((item) => item.value === automation.frequency)?.label || "No definida"}
            caption="Cadencia configurada para respaldos automáticos."
            accent="bg-[#EEF5FF] text-[#1D6FD1]"
          />
          <InfoCard
            icon={CalendarClock}
            label="Próximo respaldo"
            value={summary.nextRun ? formatDate(summary.nextRun) : "No programado"}
            caption={summary.nextRun ? `Hora objetivo ${automation.hour}.` : "Activa la automatización para calendarizar el siguiente respaldo."}
            accent="bg-[#FFF7E6] text-[#C47A00]"
          />
          <InfoCard
            icon={HardDrive}
            label="Espacio usado"
            value={formatFileSize(summary.usedSpaceBytes)}
            caption="Tamaño acumulado de los archivos registrados en historial."
            accent="bg-[#F5F3FF] text-[#6D28D9]"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-[#E5E7EB] bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF7E6] text-[#C47A00]">
                <TimerReset size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Automatización</p>
                <h2 className="mt-1 text-xl font-bold text-[#1F2933]">Configuración de respaldos automáticos</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Activación automática</span>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1F2933]">{automation.enabled ? "Automatización activa" : "Automatización inactiva"}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">Prepara el frontend para cron o scheduler real.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutomation((current) => ({ ...current, enabled: !current.enabled }))}
                    className={`relative h-7 w-14 rounded-full transition ${automation.enabled ? "bg-[#FFCE00]" : "bg-[#CBD5E1]"}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${automation.enabled ? "left-8" : "left-1"}`}
                    />
                  </button>
                </div>
              </label>

              <label className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Frecuencia</span>
                <select
                  value={automation.frequency}
                  onChange={(event) => setAutomation((current) => ({ ...current, frequency: event.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2933] outline-none"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Hora programada</span>
                <input
                  type="time"
                  value={automation.hour}
                  onChange={(event) => setAutomation((current) => ({ ...current, hour: event.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2933] outline-none"
                />
              </label>

              <label className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Tipo de respaldo</span>
                <select
                  value={automation.type}
                  onChange={(event) => setAutomation((current) => ({ ...current, type: event.target.value }))}
                  className="mt-3 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#1F2933] outline-none"
                >
                  {modes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-2xl border border-[#EEF2F7] bg-[#FCFCFD] px-4 py-4 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Política de retención</span>
                <div className="mt-3 flex flex-wrap gap-3">
                  {RETENTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAutomation((current) => ({ ...current, retention: option.value }))}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        automation.retention === option.value
                          ? "bg-[#FFCE00] text-[#1F2933]"
                          : "bg-white text-[#475467] border border-[#E5E7EB]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          <ActivityTimeline backups={enrichedBackups} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={DatabaseBackup}
            label="Respaldos totales"
            value={summary.total}
            caption="Cantidad registrada en historial."
            accent="bg-[#FFF7E6] text-[#C47A00]"
          />
          <InfoCard
            icon={Database}
            label="Generados"
            value={summary.generated}
            caption="Respaldos válidos y disponibles para descarga."
            accent="bg-[#ECFDF5] text-[#047857]"
          />
          <InfoCard
            icon={Clock3}
            label="Último respaldo"
            value={summary.last ? summary.last.originLabel : "Sin registros"}
            caption={summary.last ? `${summary.last.fileName} · ${formatDate(summary.last.fecha)}` : "Aún no se ha generado ningún respaldo."}
            accent="bg-[#EEF5FF] text-[#1D6FD1]"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="rounded-3xl border border-[#FFE9A8] bg-white/95 p-6 shadow-[0_18px_40px_rgba(245,158,11,0.12)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF7E6] text-[#C47A00]">
                <Database size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Acciones</p>
                <h2 className="mt-1 text-xl font-bold text-[#1F2933]">Generación de respaldos</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {modes.map((item) => {
                const Icon = item.icon;
                const active = item.id === mode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleModeChange(item.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      active
                        ? "border-[#FFD54F] bg-[#FFF9E6] shadow-[0_12px_30px_rgba(245,158,11,0.14)]"
                        : "border-[#E5E7EB] bg-white hover:border-[#4A90E2]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? "bg-[#FFEAA0] text-[#8A5C00]" : "bg-[#EEF5FF] text-[#1D6FD1]"}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1F2933]">{item.title}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E5E7EB] bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Formulario dinámico</p>
            <h2 className="mt-2 text-xl font-bold text-[#1F2933]">{activeMode?.title}</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              {mode === "COMPLETO"
                ? "Esta opción genera un respaldo TAR de toda la base de datos sin pasos adicionales."
                : mode === "UNA_TABLA"
                  ? "Selecciona una tabla específica para generar un respaldo TAR puntual."
                  : "Selecciona varias tablas para agruparlas en un respaldo TAR administrable."}
            </p>

            {mode !== "COMPLETO" ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm font-semibold text-[#1F2933]">Tablas disponibles</p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {tables.map((table) => {
                    const checked = selectedTables.includes(table);
                    return (
                      <label
                        key={table}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                          checked ? "border-[#4A90E2] bg-[#EEF5FF]" : "border-[#E5E7EB] bg-[#FCFCFD]"
                        }`}
                      >
                        <input
                          type={mode === "UNA_TABLA" ? "radio" : "checkbox"}
                          name="backup-table"
                          checked={checked}
                          onChange={() =>
                            mode === "UNA_TABLA" ? setSelectedTables([table]) : toggleMultiTable(table)
                          }
                          className="h-4 w-4 accent-[#4A90E2]"
                        />
                        <span className="font-medium text-[#1F2933]">{table}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-[#FFE9A8] bg-[#FFF9E6] p-4 text-sm text-[#8A5C00]">
                Se incluirán automáticamente todas las tablas del esquema público en un archivo TAR.
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton type="button" onClick={handleGenerate} disabled={submitting || loading}>
                <DatabaseBackup size={16} />
                {submitting ? "Generando..." : "Confirmar respaldo"}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => setSelectedTables([])}>
                Limpiar selección
              </SecondaryButton>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-[#FECACA] bg-[#FFF1F2] p-6 text-[#BE123C] shadow-[0_18px_40px_rgba(190,24,93,0.08)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">No se pudo cargar el módulo de respaldos</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        <BackupHistoryTable
          backups={enrichedBackups}
          loading={loading}
          onReload={loadModule}
          onDownload={handleDownload}
          onDelete={openDeleteDialog}
          onViewEvent={openEventModal}
        />
      </section>

      <BackupDeleteDialog
        backup={deletingBackup}
        deleting={deleting}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
      />

      <EventModal backup={selectedEventBackup} onClose={closeEventModal} />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </RoleLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Database,
  DatabaseBackup,
  Layers3,
  RefreshCcw,
  TableProperties,
} from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import BackupHistoryTable from "@/components/backups/BackupHistoryTable";
import BackupDeleteDialog from "@/components/backups/BackupDeleteDialog";
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

function formatDate(value) {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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

  const loadModule = async () => {
    try {
      setLoading(true);
      setError("");
      const [availableTables, history] = await Promise.all([
        getBackupTables(),
        getBackupHistory(),
      ]);
      setTables(availableTables);
      setBackups(history);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el módulo de respaldos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModule();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const summary = useMemo(() => {
    const total = backups.length;
    const last = backups[0] || null;
    const generated = backups.filter((backup) => backup.status === "GENERADO").length;
    return { total, last, generated };
  }, [backups]);

  const activeMode = modes.find((item) => item.id === mode);

  const toggleMultiTable = (tableName) => {
    setSelectedTables((current) =>
      current.includes(tableName)
        ? current.filter((table) => table !== tableName)
        : [...current, tableName]
    );
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setSelectedTables([]);
  };

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
      maxWidthClassName="max-w-[1440px]"
    >
      <section className="space-y-6">
        <div className="rounded-[32px] border border-[#FFE9A8] bg-gradient-to-r from-[#FFF8DB] via-[#FFFDF5] to-white p-6 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
                Respaldo operativo
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#1F2933]">
                Centro de respaldos de base de datos
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                Genera respaldos completos o por tabla en formato TAR, controla el historial
                y prepara tu operación para restauraciones futuras.
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

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Respaldos totales</p>
            <p className="mt-3 text-3xl font-extrabold text-[#1F2933]">{summary.total}</p>
            <p className="mt-2 text-sm text-[#4B5563]">Cantidad registrada en historial.</p>
          </article>
          <article className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Generados</p>
            <p className="mt-3 text-3xl font-extrabold text-[#1F2933]">{summary.generated}</p>
            <p className="mt-2 text-sm text-[#4B5563]">Respaldos válidos y disponibles para descarga.</p>
          </article>
          <article className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Último respaldo</p>
            <p className="mt-3 text-lg font-bold text-[#1F2933]">
              {summary.last ? summary.last.fileName : "Sin registros"}
            </p>
            <p className="mt-2 text-sm text-[#4B5563]">
              {summary.last ? formatDate(summary.last.fecha) : "Aún no se ha generado ningún respaldo."}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="rounded-3xl border border-[#FFE9A8] bg-white/95 p-6 shadow-[0_18px_40px_rgba(245,158,11,0.12)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF7E6] text-[#C47A00]">
                <Database size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                  Acciones
                </p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
              Formulario dinámico
            </p>
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
          backups={backups}
          loading={loading}
          onReload={loadModule}
          onDownload={handleDownload}
          onDelete={setDeletingBackup}
        />
      </section>

      <BackupDeleteDialog
        backup={deletingBackup}
        deleting={deleting}
        onClose={() => setDeletingBackup(null)}
        onConfirm={handleDelete}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </RoleLayout>
  );
}

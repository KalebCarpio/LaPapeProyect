"use client";

import { CheckSquare, Download, Square, X } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";

export default function ProductExportModal({
  open,
  fields,
  selectedFields,
  productCount,
  onClose,
  onToggleField,
  onSelectAll,
  onClearSelection,
  onExport,
}) {
  const selectedCount = selectedFields.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/60 bg-[#FFFCF4] shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#F6E7B8] px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
              Exportación comercial
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#1F2933]">Exportar productos a CSV</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Elige qué columnas quieres incluir en el archivo para compartir o trabajar fuera del sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#E5E7EB] bg-white text-[#4B5563] transition hover:border-[#F59E0B] hover:text-[#C47A00]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1fr,0.72fr]">
          <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1F2933]">Campos disponibles</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Seleccionados: {selectedCount} de {fields.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton type="button" onClick={onSelectAll}>
                  <CheckSquare size={16} />
                  Seleccionar todo
                </SecondaryButton>
                <SecondaryButton type="button" onClick={onClearSelection}>
                  <Square size={16} />
                  Limpiar
                </SecondaryButton>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {fields.map((field) => {
                const selected = selectedFields.includes(field.key);
                return (
                  <label
                    key={field.key}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      selected ? "border-[#4A90E2] bg-[#EEF5FF]" : "border-[#E5E7EB] bg-[#FCFCFD]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleField(field.key)}
                      className="h-4 w-4 accent-[#4A90E2]"
                    />
                    <span className="font-medium text-[#1F2933]">{field.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-[#FFE9A8] bg-[#FFF8DB] p-5">
              <p className="text-sm font-semibold text-[#8A5C00]">Resumen de exportación</p>
              <p className="mt-3 text-3xl font-extrabold text-[#1F2933]">{productCount}</p>
              <p className="mt-2 text-sm text-[#9A6700]">
                productos del listado actual se exportarán con las columnas seleccionadas.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold text-[#1F2933]">Formato pensado para usuario</p>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                El archivo exportado usa encabezados en español para que sea más fácil revisarlo,
                compartirlo o editarlo fuera de La Pape.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton type="button" onClick={onClose}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton type="button" onClick={onExport} disabled={selectedCount === 0}>
                <Download size={16} />
                Exportar CSV
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

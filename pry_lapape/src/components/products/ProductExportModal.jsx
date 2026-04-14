"use client";

import { CheckSquare, Download, Square } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { CommercialModalShell } from "@/components/commercial/CommercialUI";

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
    <CommercialModalShell
      eyebrow="Inventario"
      title="Exportar inventario a CSV"
      subtitle="Elige que columnas quieres incluir para compartir o trabajar fuera del sistema."
      maxWidthClassName="max-w-4xl"
      onClose={onClose}
    >
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
                registros del inventario actual se exportaran con las columnas seleccionadas.
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
    </CommercialModalShell>
  );
}

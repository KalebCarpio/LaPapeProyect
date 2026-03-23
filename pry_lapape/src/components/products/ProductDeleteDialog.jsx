"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";

export default function ProductDeleteDialog({
  open,
  product,
  deleting,
  onClose,
  onConfirmDelete,
  onToggleStatus,
}) {
  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#F3F4F6] px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF1D6] text-[#B45309]">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
                Confirmación
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#1F2933]">Eliminar producto</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#E5E7EB] bg-white text-[#4B5563] transition hover:border-[#F59E0B] hover:text-[#C47A00]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-3xl border border-[#FDE68A] bg-[#FFF9E6] p-5">
            <p className="font-semibold text-[#1F2933]">{product.name}</p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Si este producto sigue teniendo valor histórico para la operación, lo recomendable es
              desactivarlo en lugar de borrarlo definitivamente.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] p-5">
            <p className="text-sm font-semibold text-[#1F2933]">Opciones disponibles</p>
            <p className="mt-2 text-sm text-[#6B7280]">
              Desactivar mantiene el registro para consultas y reactivación futura. Eliminar lo retira
              del panel mock actual.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <SecondaryButton type="button" onClick={() => onToggleStatus(product)}>
              {product.isActive ? "Desactivar en lugar de borrar" : "Activar nuevamente"}
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={() => onConfirmDelete(product)}
              disabled={deleting}
              className="bg-[#F97316] text-white shadow-[0_8px_0_#d36214]"
            >
              <Trash2 size={16} />
              {deleting ? "Eliminando..." : "Eliminar definitivamente"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { CommercialModalShell } from "@/components/commercial/CommercialUI";

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
    <CommercialModalShell
      eyebrow="Inventario"
      title="Eliminar registro de inventario"
      subtitle="Revisa si conviene desactivar el producto antes de retirarlo definitivamente."
      maxWidthClassName="max-w-xl"
      onClose={onClose}
    >
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
              Desactivar mantiene el registro para consultas y reactivacion futura. Eliminar lo retira
              del inventario local y de la base de datos.
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
    </CommercialModalShell>
  );
}

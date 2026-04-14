"use client";

import { CalendarDays, Package, Tag } from "lucide-react";
import { CommercialModalShell } from "@/components/commercial/CommercialUI";
import ProductStatusBadge from "@/components/products/ProductStatusBadge";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ProductDetailModal({ open, product, onClose }) {
  if (!open || !product) return null;

  const fields = [
    { label: "SKU", value: product.sku || "Sin SKU" },
    { label: "Categoría", value: product.category || "Sin categoría" },
    { label: "Marca", value: product.brand || "Sin marca" },
    { label: "Precio", value: formatCurrency(product.price) },
    { label: "Stock", value: `${product.stock} piezas` },
  ];

  return (
    <CommercialModalShell
      eyebrow="Inventario"
      title={product.name}
      subtitle="Consulta la ficha comercial y operativa del producto seleccionado."
      maxWidthClassName="max-w-4xl"
      onClose={onClose}
    >
        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-[#F3F4F6] bg-[#FFFDF5]">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="h-72 w-full object-cover" />
              ) : (
                <div className="grid h-72 place-items-center">
                  <div className="text-center">
                    <Package className="mx-auto h-10 w-10 text-[#C47A00]" />
                <p className="mt-3 font-semibold text-[#1F2933]">Sin imagen disponible</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                      Puedes agregar una URL desde la edicion del registro de inventario.
                </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] p-5">
              <p className="text-sm font-semibold text-[#1F2933]">Estado comercial</p>
              <div className="mt-3">
                <ProductStatusBadge active={product.isActive} />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] p-5">
              <div className="flex items-center gap-2 text-[#1D6FD1]">
                <Tag size={18} />
                <p className="font-semibold">Ficha del inventario</p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.label} className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                      {field.label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#1F2933]">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] p-5">
              <p className="text-sm font-semibold text-[#1F2933]">Descripción</p>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                {product.description || "Este producto aún no tiene descripción registrada."}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] p-5">
              <div className="flex items-center gap-2 text-[#8A5C00]">
                <CalendarDays size={18} />
                <p className="font-semibold">Trazabilidad</p>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                    Alta
                  </p>
                  <p className="mt-2 text-sm text-[#1F2933]">{formatDate(product.createdAt)}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">
                    Última actualización
                  </p>
                  <p className="mt-2 text-sm text-[#1F2933]">{formatDate(product.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </CommercialModalShell>
  );
}

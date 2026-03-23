"use client";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Pencil,
  Power,
  Trash2,
  PackageSearch,
} from "lucide-react";
import ProductStatusBadge from "@/components/products/ProductStatusBadge";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function sortIcon(activeKey, currentKey, direction) {
  if (activeKey !== currentKey) return null;
  return direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

export default function ProductTable({
  products,
  sort,
  onSort,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  if (products.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-[#E5E7EB] bg-white/90 px-6 py-14 text-center shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFF7E6]">
          <PackageSearch className="h-8 w-8 text-[#C47A00]" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-[#1F2933]">No hay productos para mostrar</h3>
        <p className="mt-2 text-sm text-[#6B7280]">
          Ajusta los filtros o crea un producto nuevo para empezar a administrar tu catálogo.
        </p>
      </section>
    );
  }

  const headers = [
    { key: "name", label: "Nombre" },
    { key: "category", label: "Categoría" },
    { key: "brand", label: "Marca" },
    { key: "price", label: "Precio" },
    { key: "stock", label: "Stock" },
    { key: "isActive", label: "Estado" },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[#FFF9E6]">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                Imagen
              </th>
              {headers.map((header) => (
                <th key={header.key} className="px-5 py-4 text-left">
                  <button
                    type="button"
                    onClick={() => onSort(header.key)}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]"
                  >
                    {header.label}
                    {sortIcon(sort.key, header.key, sort.direction)}
                  </button>
                </th>
              ))}
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                SKU
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const lowStock = product.stock > 0 && product.stock <= 8;
              const noStock = product.stock === 0;

              return (
                <tr key={product.id} className="border-t border-[#F1F5F9] align-top">
                  <td className="px-5 py-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#F3F4F6] bg-[#FFFDF5]">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-semibold text-[#C47A00]">
                          Sin imagen
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-[#1F2933]">{product.name}</p>
                      <p className="mt-1 max-w-xs text-sm text-[#6B7280] line-clamp-2">
                        {product.description || "Sin descripción registrada"}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {product.category || "Sin categoría"}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {product.brand || "Sin marca"}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#1F2933]">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[#1F2933]">{product.stock}</p>
                      {noStock ? (
                        <span className="inline-flex rounded-full bg-[#FFE4E6] px-2.5 py-1 text-xs font-semibold text-[#BE123C]">
                          Sin stock
                        </span>
                      ) : null}
                      {lowStock ? (
                        <span className="inline-flex rounded-full bg-[#FFF1D6] px-2.5 py-1 text-xs font-semibold text-[#B45309]">
                          Bajo stock
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <ProductStatusBadge active={product.isActive} />
                  </td>
                  <td className="px-5 py-4 text-sm text-[#6B7280]">
                    {product.sku || "Sin SKU"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onView(product)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#D1E3FF] bg-[#EEF5FF] px-3 py-2 text-sm font-semibold text-[#1D6FD1] transition hover:bg-[#E0EDFF]"
                      >
                        <Eye size={15} />
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-[#374151] transition hover:border-[#4A90E2] hover:text-[#1D6FD1]"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(product)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#FDE68A] bg-[#FFF8DB] px-3 py-2 text-sm font-semibold text-[#8A5C00] transition hover:bg-[#FFF3BF]"
                      >
                        <Power size={15} />
                        {product.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="inline-flex items-center gap-2 rounded-full border border-[#FECACA] bg-[#FFF1F2] px-3 py-2 text-sm font-semibold text-[#BE123C] transition hover:bg-[#FFE4E6]"
                      >
                        <Trash2 size={15} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";

export default function ProductFilters({
  filters,
  options,
  onChange,
  onClear,
}) {
  return (
    <section className="rounded-3xl border border-[#FFE9A8] bg-white/95 p-5 shadow-[0_18px_40px_rgba(245,158,11,0.12)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
              Búsqueda y filtros
            </p>
            <p className="mt-1 text-sm text-[#4B5563]">
              Localiza productos rápido por nombre, SKU o estado de inventario.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SecondaryButton type="button" className="px-5" onClick={onClear}>
              <RotateCcw size={16} />
              Limpiar filtros
            </SecondaryButton>
            <PrimaryButton type="button" className="px-5">
              <SlidersHorizontal size={16} />
              Filtros activos
            </PrimaryButton>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr,1fr,1fr]">
          <label className="flex items-center gap-3 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3 focus-within:border-[#4A90E2]">
            <Search size={18} className="text-[#6B7280]" />
            <input
              value={filters.query}
              onChange={(event) => onChange("query", event.target.value)}
              placeholder="Buscar por nombre o SKU"
              className="w-full bg-transparent text-sm text-[#1F2933] outline-none placeholder:text-[#9CA3AF]"
            />
          </label>

          <select
            value={filters.category}
            onChange={(event) => onChange("category", event.target.value)}
            className="h-12 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 text-sm text-[#1F2933] outline-none focus:border-[#4A90E2]"
          >
            <option value="">Todas las categorías</option>
            {options.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(event) => onChange("brand", event.target.value)}
            className="h-12 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 text-sm text-[#1F2933] outline-none focus:border-[#4A90E2]"
          >
            <option value="">Todas las marcas</option>
            {options.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="h-12 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 text-sm text-[#1F2933] outline-none focus:border-[#4A90E2]"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <select
            value={filters.stock}
            onChange={(event) => onChange("stock", event.target.value)}
            className="h-12 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 text-sm text-[#1F2933] outline-none focus:border-[#4A90E2]"
          >
            <option value="all">Todo el stock</option>
            <option value="low">Bajo stock</option>
            <option value="out">Sin stock</option>
          </select>
        </div>
      </div>
    </section>
  );
}

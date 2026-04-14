"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderTree, Layers3, Pencil, Plus, Power, RotateCcw, Search, Tags } from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import {
  CommercialEmptyState,
  CommercialFilterCard,
  CommercialHero,
  CommercialModalShell,
  CommercialPanel,
  CommercialSummaryGrid,
} from "@/components/commercial/CommercialUI";
import Input from "@/components/Inputs";
import { createCategory, getCategories, toggleCategoryStatus, updateCategory } from "@/lib/categories.service";

const initialForm = {
  name: "",
  description: "",
  isActive: true,
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function buildCategoryForm(category) {
  return category
    ? {
        name: category.name || "",
        description: category.description || "",
        isActive: Boolean(category.isActive),
      }
    : initialForm;
}

function CategoryFormModal({ open, mode, category, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildCategoryForm(category));
  const [error, setError] = useState("");

  if (!open) return null;

  return (
    <CommercialModalShell
      title={mode === "edit" ? "Editar categoria" : "Nueva categoria"}
      subtitle="Organiza el catalogo y define si la categoria queda disponible para operacion."
      maxWidthClassName="max-w-3xl"
      onClose={onClose}
    >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.name.trim()) {
              setError("El nombre de la categoria es obligatorio.");
              return;
            }
            onSubmit({ ...category, ...form });
          }}
          className="space-y-5 px-6 py-6 sm:px-8"
        >
          <div>
            <Input
              label="Nombre de la categoria *"
              value={form.name}
              onChange={(event) => {
                setForm((current) => ({ ...current, name: event.target.value }));
                setError("");
              }}
              placeholder="Ej. Escolares"
            />
            {error ? <p className="mt-1 text-sm text-[#BE123C]">{error}</p> : null}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#333]">Descripcion</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="rounded-2xl border-2 border-[#E0E0E0] bg-white px-4 py-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
              placeholder="Describe la familia comercial o el criterio de agrupacion."
            />
          </label>

          <div className="rounded-3xl border border-[#FFE9A8] bg-[#FFF8DB] p-4">
            <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#1F2933]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 accent-[#4A90E2]"
              />
              Categoria activa
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#F6E7B8] pt-5 sm:flex-row sm:justify-end">
            <SecondaryButton type="button" onClick={onClose}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear categoria"}
            </PrimaryButton>
          </div>
        </form>
    </CommercialModalShell>
  );
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [filters, setFilters] = useState({ query: "", status: "all" });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        setError("");
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el modulo de categorias.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categoriesWithCounts = useMemo(() => categories, [categories]);

  const filteredCategories = useMemo(() => {
    return categoriesWithCounts.filter((category) => {
      const matchesQuery =
        !filters.query ||
        normalizeText(category.name).includes(normalizeText(filters.query)) ||
        normalizeText(category.description).includes(normalizeText(filters.query));
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && category.isActive) ||
        (filters.status === "inactive" && !category.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [categoriesWithCounts, filters]);

  const summary = useMemo(() => {
    const active = categories.filter((item) => item.isActive).length;
    const inactive = categories.length - active;
    const linkedProducts = categoriesWithCounts.reduce((sum, item) => sum + item.productCount, 0);
    return { total: categories.length, active, inactive, linkedProducts };
  }, [categories, categoriesWithCounts]);

  const summaryItems = useMemo(
    () => [
      {
        key: "total",
        label: "Categorias registradas",
        value: summary.total,
        description: "Estructura comercial disponible en el panel",
        icon: FolderTree,
        bgClassName: "bg-[#FFF8DB]",
        iconClassName: "text-[#C47A00]",
      },
      {
        key: "active",
        label: "Categorias activas",
        value: summary.active,
        description: "Listas para clasificar inventario y ofertas",
        icon: Tags,
        bgClassName: "bg-[#EAFBF1]",
        iconClassName: "text-[#047857]",
      },
      {
        key: "inactive",
        label: "Categorias inactivas",
        value: summary.inactive,
        description: "Se conservan sin aparecer en la operacion diaria",
        icon: Power,
        bgClassName: "bg-[#FFF1F2]",
        iconClassName: "text-[#BE123C]",
      },
      {
        key: "linkedProducts",
        label: "Productos vinculados",
        value: summary.linkedProducts,
        description: "Relacion actual entre catalogo e inventario",
        icon: Layers3,
        bgClassName: "bg-[#EEF5FF]",
        iconClassName: "text-[#1D6FD1]",
      },
    ],
    [summary]
  );

  const openCreateModal = () => {
    setFormMode("create");
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const openEditModal = (category) => {
    setFormMode("edit");
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      const saved =
        formMode === "edit" && editingCategory
          ? await updateCategory(editingCategory.id, payload)
          : await createCategory(payload);

      setCategories((current) =>
        formMode === "edit" && editingCategory
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
      );
      setIsFormOpen(false);
      setEditingCategory(null);
      setError("");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la categoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      const updated = await toggleCategoryStatus(category.id);
      setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError("");
    } catch (toggleError) {
      setError(toggleError.message || "No se pudo cambiar el estado de la categoria.");
    }
  };

  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Categorias"
      subtitle="Mantiene orden comercial, consistencia de catalogo y relacion clara con los productos."
    >
      <section className="space-y-6">
        <CommercialHero
          title="Mapa funcional de categorias"
          description="Lista, crea, edita y activa categorias con visibilidad inmediata sobre los productos que dependen de cada una."
          actions={
            <PrimaryButton type="button" onClick={openCreateModal}>
              <Plus size={16} />
              Nueva categoria
            </PrimaryButton>
          }
        />

        <CommercialSummaryGrid items={summaryItems} />

        <CommercialFilterCard
          subtitle="Filtra por nombre, descripcion o estado para revisar la estructura comercial con mas rapidez."
          actions={
            <SecondaryButton
              type="button"
              onClick={() => setFilters({ query: "", status: "all" })}
            >
              <RotateCcw size={16} />
              Limpiar filtros
            </SecondaryButton>
          }
        >
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <label className="flex items-center gap-3 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3 focus-within:border-[#4A90E2]">
              <Search size={18} className="text-[#6B7280]" />
              <input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Buscar categoria o descripcion"
                className="w-full bg-transparent text-sm text-[#1F2933] outline-none placeholder:text-[#9CA3AF]"
              />
            </label>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="h-12 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 text-sm text-[#1F2933] outline-none focus:border-[#4A90E2]"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </CommercialFilterCard>

        <CommercialPanel
          title="Listado de categorias"
          subtitle="Cada fila muestra su estado y el conteo de productos que hoy pertenecen a esa familia."
        >
          <div className="border-b border-[#F1F5F9] bg-[#FCFCFD] px-6 py-4 text-sm text-[#4B5563]">
            Mostrando <span className="font-semibold text-[#1F2933]">{filteredCategories.length}</span> categorias de{" "}
            <span className="font-semibold text-[#1F2933]">{categoriesWithCounts.length}</span>.
          </div>

          {error ? (
            <div className="border-b border-[#FECACA] bg-[#FFF1F2] px-6 py-4 text-sm text-[#BE123C]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3 px-6 py-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD]" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <CommercialEmptyState
              icon={FolderTree}
              title="No hay categorias que coincidan"
              description="Prueba con otro termino de busqueda o restablece los filtros para volver al listado completo."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#FFF9E6]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Categoria</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Descripcion</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Productos</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Estado</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="border-t border-[#F1F5F9] align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#1F2933]">{category.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#4B5563]">
                        {category.description || "Sin descripcion operativa."}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#1D6FD1]">
                          {category.productCount} productos
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            category.isActive ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#F3F4F6] text-[#4B5563]"
                          }`}
                        >
                          {category.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-3">
                          <SecondaryButton type="button" onClick={() => openEditModal(category)}>
                            <Pencil size={16} />
                            Editar
                          </SecondaryButton>
                          <PrimaryButton type="button" onClick={() => handleToggleStatus(category)}>
                            <Power size={16} />
                            {category.isActive ? "Desactivar" : "Activar"}
                          </PrimaryButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CommercialPanel>
      </section>

      <CategoryFormModal
        key={`${formMode}-${editingCategory?.id || "new"}-${isFormOpen ? "open" : "closed"}`}
        open={isFormOpen}
        mode={formMode}
        category={editingCategory}
        saving={saving}
        onClose={() => {
          if (saving) return;
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
      />
    </RoleLayout>
  );
}

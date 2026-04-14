"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Layers3,
  Percent,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Tag,
  TicketPercent,
} from "lucide-react";
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
import { getProducts } from "@/lib/products.service";
import { createOffer, getOffers, toggleOfferStatus, updateOffer } from "@/lib/offers.service";
import { getCategories } from "@/lib/categories.service";

const initialForm = {
  name: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  appliesTo: "category",
  targetId: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function buildOfferForm(offer) {
  return offer
    ? {
        name: offer.name || "",
        description: offer.description || "",
        discountType: offer.discountType || "percentage",
        discountValue: String(offer.discountValue ?? ""),
        appliesTo: offer.appliesTo || "category",
        targetId: offer.targetId || "",
        startsAt: offer.startsAt || "",
        endsAt: offer.endsAt || "",
        isActive: Boolean(offer.isActive),
      }
    : initialForm;
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDiscount(offer) {
  return offer.discountType === "percentage"
    ? `${offer.discountValue}%`
    : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(offer.discountValue);
}

function statusLabel(offer) {
  const now = new Date();
  const start = offer.startsAt ? new Date(`${offer.startsAt}T00:00:00`) : null;
  const end = offer.endsAt ? new Date(`${offer.endsAt}T23:59:59`) : null;
  if (!offer.isActive) return { label: "Inactiva", tone: "bg-[#F3F4F6] text-[#4B5563]" };
  if (start && start > now) return { label: "Programada", tone: "bg-[#EEF5FF] text-[#1D6FD1]" };
  if (end && end < now) return { label: "Vencida", tone: "bg-[#FFF1F2] text-[#BE123C]" };
  return { label: "Activa", tone: "bg-[#ECFDF5] text-[#047857]" };
}

function OfferFormModal({ open, mode, offer, options, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildOfferForm(offer));
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const targetOptions = form.appliesTo === "product" ? options.products : options.categories;

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "appliesTo" ? { targetId: "" } : {}),
    }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!form.discountValue || Number(form.discountValue) <= 0) nextErrors.discountValue = "Ingresa un descuento valido.";
    if (!form.targetId) nextErrors.targetId = "Selecciona el destino de la oferta.";
    if (!form.startsAt) nextErrors.startsAt = "Define la fecha de inicio.";
    if (!form.endsAt) nextErrors.endsAt = "Define la fecha de fin.";
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) {
      nextErrors.endsAt = "La vigencia final debe ser posterior al inicio.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      ...offer,
      ...form,
      discountValue: Number(form.discountValue),
    });
  };

  return (
    <CommercialModalShell
      title={mode === "edit" ? "Editar oferta" : "Nueva oferta"}
      subtitle="Configura vigencia, descuento y alcance sobre producto o categoria."
      maxWidthClassName="max-w-4xl"
      onClose={onClose}
    >
        <form onSubmit={handleSubmit} className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <Input
                label="Nombre de la oferta *"
                value={form.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Ej. Regreso a clases"
              />
              {errors.name ? <p className="mt-1 text-sm text-[#BE123C]">{errors.name}</p> : null}
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Descripcion</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => handleChange("description", event.target.value)}
                className="rounded-2xl border-2 border-[#E0E0E0] bg-white px-4 py-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
                placeholder="Objetivo comercial o notas internas."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-[#333]">Tipo de descuento *</span>
                <select
                  value={form.discountType}
                  onChange={(event) => handleChange("discountType", event.target.value)}
                  className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed">Monto fijo</option>
                </select>
              </label>
              <div>
                <Input
                  label="Valor del descuento *"
                  type="number"
                  min="1"
                  step={form.discountType === "percentage" ? "1" : "0.01"}
                  value={form.discountValue}
                  onChange={(event) => handleChange("discountValue", event.target.value)}
                  placeholder={form.discountType === "percentage" ? "10" : "50.00"}
                />
                {errors.discountValue ? (
                  <p className="mt-1 text-sm text-[#BE123C]">{errors.discountValue}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-[#333]">Aplicar a *</span>
                <select
                  value={form.appliesTo}
                  onChange={(event) => handleChange("appliesTo", event.target.value)}
                  className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
                >
                  <option value="category">Categoria</option>
                  <option value="product">Producto</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-[#333]">Objetivo *</span>
                <select
                  value={form.targetId}
                  onChange={(event) => handleChange("targetId", event.target.value)}
                  className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
                >
                  <option value="">Selecciona una opcion</option>
                  {targetOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {errors.targetId ? <p className="text-sm text-[#BE123C]">{errors.targetId}</p> : null}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input
                  label="Inicio de vigencia *"
                  type="date"
                  value={form.startsAt}
                  onChange={(event) => handleChange("startsAt", event.target.value)}
                />
                {errors.startsAt ? <p className="mt-1 text-sm text-[#BE123C]">{errors.startsAt}</p> : null}
              </div>
              <div>
                <Input
                  label="Fin de vigencia *"
                  type="date"
                  value={form.endsAt}
                  onChange={(event) => handleChange("endsAt", event.target.value)}
                />
                {errors.endsAt ? <p className="mt-1 text-sm text-[#BE123C]">{errors.endsAt}</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-[#FFE9A8] bg-[#FFF8DB] p-4">
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#1F2933]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => handleChange("isActive", event.target.checked)}
                  className="h-4 w-4 accent-[#4A90E2]"
                />
                Oferta activa
              </label>
              <p className="mt-2 text-sm text-[#9A6700]">
                Si la desactivas, la regla se conserva pero queda fuera de operacion.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#F6E7B8] pt-5 lg:col-span-2 sm:flex-row sm:justify-end">
            <SecondaryButton type="button" onClick={onClose}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear oferta"}
            </PrimaryButton>
          </div>
        </form>
    </CommercialModalShell>
  );
}

export default function OfertasPage() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingOffer, setEditingOffer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [filters, setFilters] = useState({ query: "", scope: "all", status: "all" });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        setError("");
        const [offersData, productsData, categoriesData] = await Promise.all([
          getOffers(),
          getProducts(),
          getCategories(),
        ]);
        setOffers(offersData);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el modulo de ofertas.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Map(
        categories
          .filter((item) => item.isActive)
          .map((item) => [item.id, { id: item.id, name: item.name }])
      ).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const productOptions = useMemo(() => {
    return [...products]
      .map((item) => ({ id: item.id, name: item.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const summary = useMemo(() => {
    const active = offers.filter((offer) => offer.isActive).length;
    const byCategory = offers.filter((offer) => offer.appliesTo === "category").length;
    const byProduct = offers.filter((offer) => offer.appliesTo === "product").length;
    return { total: offers.length, active, byCategory, byProduct };
  }, [offers]);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesQuery =
        !filters.query ||
        offer.name.toLowerCase().includes(filters.query.toLowerCase()) ||
        String(offer.targetValue || "").toLowerCase().includes(filters.query.toLowerCase());
      const matchesScope = filters.scope === "all" || offer.appliesTo === filters.scope;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && offer.isActive) ||
        (filters.status === "inactive" && !offer.isActive);
      return matchesQuery && matchesScope && matchesStatus;
    });
  }, [filters, offers]);

  const summaryItems = useMemo(
    () => [
      {
        key: "total",
        label: "Ofertas registradas",
        value: summary.total,
        description: "Campanas comerciales persistidas en la base local",
        icon: TicketPercent,
        bgClassName: "bg-[#FFF8DB]",
        iconClassName: "text-[#C47A00]",
      },
      {
        key: "active",
        label: "Activas o programadas",
        value: summary.active,
        description: "Ofertas disponibles para operar o calendarizar",
        icon: Power,
        bgClassName: "bg-[#EAFBF1]",
        iconClassName: "text-[#047857]",
      },
      {
        key: "byCategory",
        label: "Por categoria",
        value: summary.byCategory,
        description: "Descuentos pensados para familias completas",
        icon: Layers3,
        bgClassName: "bg-[#EEF5FF]",
        iconClassName: "text-[#1D6FD1]",
      },
      {
        key: "byProduct",
        label: "Por producto",
        value: summary.byProduct,
        description: "Promociones puntuales para rotacion o impulso",
        icon: Tag,
        bgClassName: "bg-[#F5F3FF]",
        iconClassName: "text-[#7C3AED]",
      },
    ],
    [summary]
  );

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      const saved =
        formMode === "edit" && editingOffer
          ? await updateOffer(editingOffer.id, payload)
          : await createOffer(payload);

      setOffers((current) =>
        formMode === "edit" && editingOffer
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
      );
      setIsFormOpen(false);
      setEditingOffer(null);
      setError("");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la oferta.");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setFormMode("create");
    setEditingOffer(null);
    setIsFormOpen(true);
  };

  const openEditModal = (offer) => {
    setFormMode("edit");
    setEditingOffer(offer);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (offer) => {
    try {
      const updated = await toggleOfferStatus(offer.id);
      setOffers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError("");
    } catch (toggleError) {
      setError(toggleError.message || "No se pudo cambiar el estado de la oferta.");
    }
  };

  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Ofertas"
      subtitle="Diseña promociones con vigencia, descuento y alcance comercial claro."
    >
      <section className="space-y-6">
        <CommercialHero
          title="Motor de ofertas y campanas"
          description="Define descuentos con vigencia, objetivo por producto o categoria y mantenlos conectados con inventario y categorias reales en local."
          actions={
            <PrimaryButton type="button" onClick={openCreateModal}>
              <Plus size={16} />
              Nueva oferta
            </PrimaryButton>
          }
        />

        <CommercialSummaryGrid items={summaryItems} />

        <CommercialFilterCard
          subtitle="Busca por nombre o objetivo y filtra por alcance o estado comercial."
          actions={
            <SecondaryButton type="button" onClick={() => setFilters({ query: "", scope: "all", status: "all" })}>
              <RotateCcw size={16} />
              Limpiar filtros
            </SecondaryButton>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr,1fr]">
            <label className="flex items-center gap-3 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3 focus-within:border-[#4A90E2]">
              <Search size={18} className="text-[#6B7280]" />
              <input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Buscar oferta u objetivo"
                className="w-full bg-transparent text-sm text-[#1F2933] outline-none placeholder:text-[#9CA3AF]"
              />
            </label>
            <select
              value={filters.scope}
              onChange={(event) => setFilters((current) => ({ ...current, scope: event.target.value }))}
              className="h-12 rounded-2xl border-2 border-[#E5E7EB] bg-[#FCFCFD] px-4 text-sm text-[#1F2933] outline-none focus:border-[#4A90E2]"
            >
              <option value="all">Todo el alcance</option>
              <option value="category">Por categoria</option>
              <option value="product">Por producto</option>
            </select>
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
          title="Listado de ofertas"
          subtitle="Administra vigencia, descuento, objetivo y estado comercial."
        >
          <div className="border-b border-[#F1F5F9] bg-[#FCFCFD] px-6 py-4 text-sm text-[#4B5563]">
            Mostrando <span className="font-semibold text-[#1F2933]">{filteredOffers.length}</span> ofertas de{" "}
            <span className="font-semibold text-[#1F2933]">{offers.length}</span>.
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
          ) : filteredOffers.length === 0 ? (
            <CommercialEmptyState
              icon={TicketPercent}
              title="No hay ofertas que coincidan"
              description="Ajusta la busqueda o los filtros para revisar otras promociones registradas."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#FFF9E6]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Oferta</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Descuento</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Aplicacion</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Vigencia</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Estado</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer) => {
                    const badge = statusLabel(offer);
                    const relatedCount = offer.relatedProductCount ?? 0;

                    return (
                      <tr key={offer.id} className="border-t border-[#F1F5F9] align-top">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#1F2933]">{offer.name}</p>
                          <p className="mt-1 max-w-xs text-sm text-[#6B7280]">
                            {offer.description || "Sin descripcion adicional."}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF8DB] px-3 py-1.5 text-sm font-semibold text-[#8A5C00]">
                            <Percent size={14} />
                            {formatDiscount(offer)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#4B5563]">
                          <p className="font-medium text-[#1F2933]">
                            {offer.appliesTo === "category" ? "Categoria" : "Producto"}: {offer.targetValue}
                          </p>
                          <p className="mt-1 text-xs text-[#6B7280]">
                            Impacta actualmente {relatedCount} registro{relatedCount === 1 ? "" : "s"} segun la relacion activa en local.
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#4B5563]">
                          {formatDate(offer.startsAt)} al {formatDate(offer.endsAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => openEditModal(offer)}>
                              <Pencil size={16} />
                              Editar
                            </SecondaryButton>
                            <PrimaryButton type="button" onClick={() => handleToggleStatus(offer)}>
                              <Power size={16} />
                              {offer.isActive ? "Desactivar" : "Activar"}
                            </PrimaryButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CommercialPanel>
      </section>

      <OfferFormModal
        key={`${formMode}-${editingOffer?.id || "new"}-${isFormOpen ? "open" : "closed"}`}
        open={isFormOpen}
        mode={formMode}
        offer={editingOffer}
        options={{ categories: categoryOptions, products: productOptions }}
        saving={saving}
        onClose={() => {
          if (saving) return;
          setIsFormOpen(false);
          setEditingOffer(null);
        }}
        onSubmit={handleSubmit}
      />
    </RoleLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import Input from "@/components/Inputs";

const initialForm = {
  name: "",
  price: "",
  stock: "",
  sku: "",
  description: "",
  category: "",
  brand: "",
  imageUrl: "",
  isActive: true,
};

export default function ProductFormModal({
  open,
  mode,
  product,
  saving,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    setForm(
      product
        ? {
            name: product.name || "",
            price: String(product.price ?? ""),
            stock: String(product.stock ?? ""),
            sku: product.sku || "",
            description: product.description || "",
            category: product.category || "",
            brand: product.brand || "",
            imageUrl: product.imageUrl || "",
            isActive: Boolean(product.isActive),
          }
        : initialForm
    );
    setErrors({});
  }, [open, product]);

  const title = mode === "edit" ? "Editar producto" : "Nuevo producto";
  const description =
    mode === "edit"
      ? "Actualiza la información comercial y operativa del producto."
      : "Registra rápido un producto con los datos mínimos y completa el resto cuando lo necesites.";

  const imagePreview = useMemo(() => form.imageUrl.trim(), [form.imageUrl]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (form.price === "" || Number(form.price) < 0) nextErrors.price = "Ingresa un precio válido.";
    if (form.stock === "" || Number(form.stock) < 0) nextErrors.stock = "Ingresa un stock válido.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      ...product,
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      sku: form.sku.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      imageUrl: form.imageUrl.trim(),
      isActive: Boolean(form.isActive),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/60 bg-[#FFFCF4] shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#F6E7B8] px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
              Gestión comercial
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#1F2933]">{title}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#E5E7EB] bg-white text-[#4B5563] transition hover:border-[#F59E0B] hover:text-[#C47A00]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input
                  label="Nombre del producto *"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="Ej. Cuaderno profesional"
                />
                {errors.name ? <p className="mt-1 text-sm text-[#BE123C]">{errors.name}</p> : null}
              </div>
              <div>
                <Input
                  label="SKU (opcional)"
                  value={form.sku}
                  onChange={(event) => handleChange("sku", event.target.value)}
                  placeholder="Ej. LAP-CUA-001"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Input
                  label="Precio *"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => handleChange("price", event.target.value)}
                  placeholder="0.00"
                />
                {errors.price ? <p className="mt-1 text-sm text-[#BE123C]">{errors.price}</p> : null}
              </div>
              <div>
                <Input
                  label="Stock *"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => handleChange("stock", event.target.value)}
                  placeholder="0"
                />
                {errors.stock ? <p className="mt-1 text-sm text-[#BE123C]">{errors.stock}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Categoría (opcional)"
                value={form.category}
                onChange={(event) => handleChange("category", event.target.value)}
                placeholder="Ej. Cuadernos"
              />
              <Input
                label="Marca (opcional)"
                value={form.brand}
                onChange={(event) => handleChange("brand", event.target.value)}
                placeholder="Ej. Scribe"
              />
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Descripción (opcional)</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => handleChange("description", event.target.value)}
                placeholder="Agrega una descripción útil para operación o catálogo."
                className="rounded-2xl border-2 border-[#E0E0E0] bg-white px-4 py-3 text-[#1C1C1C] outline-none transition focus:border-[#4A90E2]"
              />
            </label>

            <div className="rounded-3xl border border-[#FFE9A8] bg-[#FFF8DB] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#8A5C00]">Estado del producto</p>
                  <p className="text-sm text-[#9A6700]">
                    Puedes dejarlo activo para operación o pausarlo si aún no debe mostrarse.
                  </p>
                </div>
                <label className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1F2933] shadow-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => handleChange("isActive", event.target.checked)}
                    className="h-4 w-4 accent-[#4A90E2]"
                  />
                  {form.isActive ? "Activo" : "Inactivo"}
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EEF5FF] text-[#1D6FD1]">
                  <ImagePlus size={20} />
                </div>
                <div>
                  <p className="font-semibold text-[#1F2933]">Imagen del producto</p>
                  <p className="text-sm text-[#6B7280]">Opcional, pero útil para identificación rápida.</p>
                </div>
              </div>

              <div className="mt-4">
                <Input
                  label="URL de imagen (opcional)"
                  value={form.imageUrl}
                  onChange={(event) => handleChange("imageUrl", event.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="mt-4 overflow-hidden rounded-3xl border border-dashed border-[#E5E7EB] bg-[#FFFDF5]">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Vista previa del producto"
                    className="h-64 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="grid h-64 place-items-center px-6 text-center">
                    <div>
                      <p className="font-semibold text-[#1F2933]">Vista previa de imagen</p>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Agrega una URL para mostrar la vista previa del producto aquí.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold text-[#1F2933]">Alta rápida recomendada</p>
              <p className="mt-2 text-sm text-[#6B7280]">
                Para registrar un producto en operación diaria solo necesitas:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#374151]">
                <li>Nombre</li>
                <li>Precio</li>
                <li>Stock</li>
              </ul>
              <p className="mt-3 text-sm text-[#6B7280]">
                SKU, marca, categoría, descripción e imagen pueden completarse después sin detener la captura.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#F6E7B8] pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
            <SecondaryButton type="button" onClick={onClose}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear producto"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  Download,
  FileUp,
  PackagePlus,
  RefreshCcw,
  Upload,
} from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import ProductFilters from "@/components/products/ProductFilters";
import ProductSummaryCards from "@/components/products/ProductSummaryCards";
import ProductTable from "@/components/products/ProductTable";
import ProductFormModal from "@/components/products/ProductFormModal";
import ProductDetailModal from "@/components/products/ProductDetailModal";
import ProductDeleteDialog from "@/components/products/ProductDeleteDialog";
import ProductImportModal from "@/components/products/ProductImportModal";
import ProductExportModal from "@/components/products/ProductExportModal";
import {
  createProduct,
  deleteProduct,
  downloadOfficialProductsCsvTemplate,
  exportProductsToCsv,
  getExportableProductFields,
  getProductFilterOptions,
  getOfficialProductsCsvHeaders,
  getProducts,
  importProductsFromCsvFile,
  toggleProductStatus,
  updateProduct,
} from "@/lib/products.service";

const PAGE_SIZE = 6;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compareValues(a, b, direction) {
  if (typeof a === "number" && typeof b === "number") {
    return direction === "asc" ? a - b : b - a;
  }

  const valueA = normalizeText(a);
  const valueB = normalizeText(b);
  if (valueA < valueB) return direction === "asc" ? -1 : 1;
  if (valueA > valueB) return direction === "asc" ? 1 : -1;
  return 0;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const accent = toast.type === "error" ? "bg-[#FFF1F2] text-[#BE123C]" : "bg-[#ECFDF5] text-[#047857]";

  return (
    <div className={`fixed bottom-6 right-6 z-[80] max-w-sm rounded-2xl px-4 py-3 shadow-xl ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{toast.message}</p>
        <button type="button" onClick={onClose} className="text-xs font-bold uppercase">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function ProductosPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    brand: "",
    status: "all",
    stock: "all",
  });
  const [sort, setSort] = useState({ key: "updatedAt", direction: "desc" });
  const [detailProduct, setDetailProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [selectedExportFields, setSelectedExportFields] = useState(() =>
    getExportableProductFields().map((field) => field.key)
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const items = await getProducts();
      setProducts(items);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filterOptions = useMemo(() => getProductFilterOptions(products), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        !filters.query ||
        normalizeText(product.name).includes(normalizeText(filters.query)) ||
        normalizeText(product.sku).includes(normalizeText(filters.query));

      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesBrand = !filters.brand || product.brand === filters.brand;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && product.isActive) ||
        (filters.status === "inactive" && !product.isActive);

      const matchesStock =
        filters.stock === "all" ||
        (filters.stock === "low" && product.stock > 0 && product.stock <= 8) ||
        (filters.stock === "out" && product.stock === 0);

      return matchesQuery && matchesCategory && matchesBrand && matchesStatus && matchesStock;
    });
  }, [filters, products]);

  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    return items.sort((left, right) => compareValues(left[sort.key], right[sort.key], sort.direction));
  }, [filteredProducts, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedProducts.slice(start, start + PAGE_SIZE);
  }, [page, sortedProducts]);

  const summary = useMemo(() => {
    const active = products.filter((product) => product.isActive).length;
    const inactive = products.length - active;
    const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 8).length;

    return {
      total: products.length,
      active,
      inactive,
      lowStock,
    };
  }, [products]);

  const setFilterValue = (field, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({
      query: "",
      category: "",
      brand: "",
      status: "all",
      stock: "all",
    });
  };

  const handleSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const openCreateModal = () => {
    setFormMode("create");
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const openEditModal = (product) => {
    setFormMode("edit");
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    if (saving) return;
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (payload) => {
    try {
      setSaving(true);
      if (formMode === "edit" && editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        setProducts((current) =>
          current.map((product) => (product.id === updated.id ? updated : product))
        );
        setToast({ type: "success", message: "Producto actualizado correctamente." });
      } else {
        const created = await createProduct(payload);
        setProducts((current) => [created, ...current]);
        setToast({ type: "success", message: "Producto registrado correctamente." });
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (saveError) {
      setToast({ type: "error", message: saveError.message || "No se pudo guardar el producto." });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async (product) => {
    try {
      setDeleting(true);
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setDeletingProduct(null);
      setToast({ type: "success", message: "Producto eliminado del panel." });
    } catch (deleteError) {
      setToast({ type: "error", message: deleteError.message || "No se pudo eliminar el producto." });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const updated = await toggleProductStatus(product.id);
      setProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      if (deletingProduct?.id === product.id) {
        setDeletingProduct(updated);
      }
      if (detailProduct?.id === product.id) {
        setDetailProduct(updated);
      }
      setToast({
        type: "success",
        message: updated.isActive ? "Producto activado correctamente." : "Producto desactivado correctamente.",
      });
    } catch (toggleError) {
      setToast({ type: "error", message: toggleError.message || "No se pudo actualizar el estado." });
    }
  };

  const exportFields = useMemo(() => getExportableProductFields(), []);
  const officialHeaders = useMemo(() => getOfficialProductsCsvHeaders().join(","), []);

  const handleDownloadTemplate = () => {
    downloadOfficialProductsCsvTemplate();
    setToast({ type: "success", message: "Plantilla CSV descargada correctamente." });
  };

  const handleOpenImport = () => {
    setSelectedImportFile(null);
    setIsImportOpen(true);
  };

  const handleImportConfirm = async () => {
    if (!selectedImportFile) return;
    try {
      setImporting(true);
      const result = await importProductsFromCsvFile(selectedImportFile);
      const items = await getProducts();
      setProducts(items);
      setPage(1);
      setIsImportOpen(false);
      setSelectedImportFile(null);
      setLastImportSummary(result);
      setToast({
        type: "success",
        message:
          result.created || result.updated
            ? `Importación completada. Creados: ${result.created}, actualizados: ${result.updated}, errores: ${result.errors}.`
            : "La plantilla no contiene filas válidas para importar todavía.",
      });
    } catch (importError) {
      setToast({
        type: "error",
        message:
          importError.message ||
          "El archivo no coincide con la plantilla oficial. Descarga la plantilla correcta.",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleToggleExportField = (fieldKey) => {
    setSelectedExportFields((current) =>
      current.includes(fieldKey)
        ? current.filter((item) => item !== fieldKey)
        : [...current, fieldKey]
    );
  };

  const handleExport = async () => {
    try {
      await exportProductsToCsv(sortedProducts, selectedExportFields);
      setIsExportOpen(false);
      setToast({ type: "success", message: "CSV exportado correctamente." });
    } catch (exportError) {
      setToast({ type: "error", message: exportError.message || "No se pudo exportar el CSV." });
    }
  };

  return (
    <RoleLayout
      requiredRole="DUENO"
      title="Gestión de productos"
      subtitle="Administra tu catálogo, ajusta inventario y mantén tu operación comercial al día."
    >
      <section className="space-y-6">
        <div className="rounded-[32px] border border-[#FFE9A8] bg-gradient-to-r from-[#FFF8DB] via-[#FFFDF5] to-white p-6 shadow-[0_18px_40px_rgba(245,158,11,0.14)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C47A00]">
                Administración comercial
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#1F2933]">
                Control central de productos
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                Consulta existencias, ajusta datos clave y da de alta nuevos productos sin salir del
                flujo operativo diario. El módulo queda listo para conectarse después a la API real.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <SecondaryButton type="button" onClick={loadProducts}>
                <RefreshCcw size={16} />
                Recargar listado
              </SecondaryButton>
              <SecondaryButton type="button" onClick={() => setIsExportOpen(true)}>
                <Download size={16} />
                Exportar
              </SecondaryButton>
              <SecondaryButton type="button" onClick={handleOpenImport} disabled={importing}>
                <Upload size={16} />
                Importar
              </SecondaryButton>
              <PrimaryButton type="button" onClick={openCreateModal}>
                <PackagePlus size={16} />
                Nuevo producto
              </PrimaryButton>
            </div>
          </div>
        </div>

        <ProductSummaryCards summary={summary} />

        <ProductFilters
          filters={filters}
          options={filterOptions}
          onChange={setFilterValue}
          onClear={clearFilters}
        />

        <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] p-4 text-sm text-[#4B5563]">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <p>
              Mostrando <span className="font-semibold text-[#1F2933]">{sortedProducts.length}</span> productos
              filtrados de un total de <span className="font-semibold text-[#1F2933]">{products.length}</span>.
            </p>
            <p>
              Página <span className="font-semibold text-[#1F2933]">{page}</span> de{" "}
              <span className="font-semibold text-[#1F2933]">{totalPages}</span>
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-[#D7E7FF] bg-[#F6FAFF] p-4 text-sm text-[#4B5563]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-[#1F2933]">Centro de importación y exportación</p>
              <p className="mt-1">
                La plantilla oficial contiene solo esta fila de encabezados:
                <span className="mt-2 block rounded-2xl bg-white px-3 py-2 font-mono text-xs text-[#1D6FD1]">
                  {officialHeaders}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SecondaryButton type="button" onClick={() => setIsExportOpen(true)}>
                <Download size={16} />
                Configurar exportación
              </SecondaryButton>
              <SecondaryButton type="button" onClick={handleOpenImport}>
                <FileUp size={16} />
                Abrir importación
              </SecondaryButton>
            </div>
          </div>
        </div>

        {lastImportSummary ? (
          <div className="rounded-3xl border border-[#D7E7FF] bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
                  Última importación
                </p>
                <h3 className="mt-2 text-xl font-bold text-[#1F2933]">Resumen del archivo procesado</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#ECFDF5] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#059669]">Creados</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#1F2933]">{lastImportSummary.created}</p>
                </div>
                <div className="rounded-2xl bg-[#EEF5FF] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D6FD1]">Actualizados</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#1F2933]">{lastImportSummary.updated}</p>
                </div>
                <div className="rounded-2xl bg-[#FFF1F2] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#BE123C]">Errores</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#1F2933]">{lastImportSummary.errors}</p>
                </div>
              </div>
            </div>

            {lastImportSummary.detail?.some((item) => item.status === "ERROR") ? (
              <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FFF8F8] p-4">
                <p className="text-sm font-semibold text-[#BE123C]">Filas con observaciones</p>
                <div className="mt-3 space-y-2 text-sm text-[#6B7280]">
                  {lastImportSummary.detail
                    .filter((item) => item.status === "ERROR")
                    .slice(0, 5)
                    .map((item) => (
                      <p key={`${item.row}-${item.sku || "sin-sku"}`}>
                        Fila {item.row}: {item.error}
                      </p>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <section className="rounded-3xl border border-[#FECACA] bg-[#FFF1F2] p-6 text-[#BE123C] shadow-[0_18px_40px_rgba(190,24,93,0.08)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">No se pudo cargar el módulo de productos</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <section className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-[#E5E7EB] bg-white/80"
              />
            ))}
          </section>
        ) : (
          <ProductTable
            products={paginatedProducts}
            sort={sort}
            onSort={handleSort}
            onView={setDetailProduct}
            onEdit={openEditModal}
            onDelete={setDeletingProduct}
            onToggleStatus={handleToggleStatus}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Boxes size={16} />
            <span>Inventario visual listo para futura integración con endpoints reales.</span>
          </div>

          <div className="flex items-center gap-2">
            <SecondaryButton type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Anterior
            </SecondaryButton>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#1F2933]">
              {page} / {totalPages}
            </div>
            <PrimaryButton
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Siguiente
            </PrimaryButton>
          </div>
        </div>
      </section>

      <ProductFormModal
        open={isFormOpen}
        mode={formMode}
        product={editingProduct}
        saving={saving}
        onClose={closeFormModal}
        onSubmit={handleSaveProduct}
      />

      <ProductDetailModal
        open={Boolean(detailProduct)}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
      />

      <ProductDeleteDialog
        open={Boolean(deletingProduct)}
        product={deletingProduct}
        deleting={deleting}
        onClose={() => setDeletingProduct(null)}
        onConfirmDelete={handleConfirmDelete}
        onToggleStatus={handleToggleStatus}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
      <ProductImportModal
        open={isImportOpen}
        importing={importing}
        selectedFile={selectedImportFile}
        onClose={() => {
          if (importing) return;
          setIsImportOpen(false);
          setSelectedImportFile(null);
        }}
        onSelectFile={setSelectedImportFile}
        onImport={handleImportConfirm}
        onDownloadTemplate={handleDownloadTemplate}
      />
      <ProductExportModal
        open={isExportOpen}
        fields={exportFields}
        selectedFields={selectedExportFields}
        productCount={sortedProducts.length}
        onClose={() => setIsExportOpen(false)}
        onToggleField={handleToggleExportField}
        onSelectAll={() => setSelectedExportFields(exportFields.map((field) => field.key))}
        onClearSelection={() => setSelectedExportFields([])}
        onExport={handleExport}
      />
    </RoleLayout>
  );
}

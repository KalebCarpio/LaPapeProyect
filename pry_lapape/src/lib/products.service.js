import { api, apiURL } from "@/lib/api";

const CSV_HEADERS = [
  "nombre",
  "codigo_producto",
  "descripcion",
  "categoria",
  "marca",
  "precio",
  "stock",
  "imagen_url",
];

const EXPORT_FIELDS = [
  { key: "nombre", label: "Nombre" },
  { key: "codigo_producto", label: "Código de producto" },
  { key: "descripcion", label: "Descripción" },
  { key: "categoria", label: "Categoría" },
  { key: "marca", label: "Marca" },
  { key: "precio", label: "Precio" },
  { key: "stock", label: "Stock" },
  { key: "imagen_url", label: "Imagen URL" },
];

function getAuthToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getProducts() {
  return api("/products", { method: "GET" });
}

export async function createProduct(payload) {
  return api("/products", { method: "POST", body: payload });
}

export async function updateProduct(productId, payload) {
  return api(`/products/${productId}`, { method: "PUT", body: payload });
}

export async function deleteProduct(productId) {
  return api(`/products/${productId}`, { method: "DELETE" });
}

export async function toggleProductStatus(productId) {
  return api(`/products/${productId}/toggle-status`, { method: "PATCH" });
}

export function getProductFilterOptions(products) {
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort();
  const brands = Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort();

  return { categories, brands };
}

export function getOfficialProductsCsvHeaders() {
  return [...CSV_HEADERS];
}

export function getExportableProductFields() {
  return [...EXPORT_FIELDS];
}

export async function downloadOfficialProductsCsvTemplate() {
  const token = getAuthToken();
  const response = await fetch(apiURL("/products/template"), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo descargar la plantilla oficial.");
  }

  const blob = await response.blob();
  downloadBlob(blob, "lapape_plantilla_productos.csv");
}

export async function importProductsFromCsvFile(file) {
  const content = await file.text();
  const res = await api("/products/import", {
    method: "POST",
    body: { content },
  });
  return res.summary;
}

export async function exportProductsToCsv(_products, selectedFieldKeys) {
  const token = getAuthToken();
  const columns = selectedFieldKeys.join(",");
  const response = await fetch(apiURL(`/products/export?columns=${encodeURIComponent(columns)}`), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = "No se pudo exportar el CSV.";
    try {
      const data = await response.json();
      message = data?.message || data?.error || message;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  downloadBlob(blob, "lapape_productos_exportados.csv");
}

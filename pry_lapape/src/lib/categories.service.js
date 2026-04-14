import { api } from "@/lib/api";

export async function getCategories() {
  return api("/categories", { method: "GET" });
}

export async function getActiveCategories() {
  return api("/categories?active=true", { method: "GET" });
}

export async function createCategory(payload) {
  return api("/categories", { method: "POST", body: payload });
}

export async function updateCategory(categoryId, payload) {
  return api(`/categories/${categoryId}`, { method: "PUT", body: payload });
}

export async function toggleCategoryStatus(categoryId) {
  return api(`/categories/${categoryId}/toggle-status`, { method: "PATCH" });
}

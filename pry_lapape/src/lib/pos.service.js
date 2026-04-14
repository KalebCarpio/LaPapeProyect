import { api } from "@/lib/api";

function withQuery(path, params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, value);
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export async function getPosProducts(branchId) {
  return api(withQuery("/pos/products", { branchId }), { method: "GET" });
}

export async function createPosSale(payload) {
  return api("/pos/sales", { method: "POST", body: payload });
}

export async function reprintPosTicket(saleId) {
  return api(`/pos/sales/${saleId}/reprint`, { method: "POST", body: {} });
}

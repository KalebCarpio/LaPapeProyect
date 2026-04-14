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

export async function getBranchProducts(branchId) {
  return api(withQuery("/sales/branch-products", { branchId }), { method: "GET" });
}

export async function getSales(filters = {}) {
  return api(withQuery("/sales", filters), { method: "GET" });
}

export async function getSaleDetail(saleId) {
  return api(`/sales/${saleId}`, { method: "GET" });
}

export async function createSale(payload) {
  return api("/sales", { method: "POST", body: payload });
}

export async function reprintSaleTicket(saleId) {
  return api(`/sales/${saleId}/reprint`, { method: "POST", body: {} });
}

export async function cancelSale(saleId, reason) {
  return api(`/sales/${saleId}/cancel`, {
    method: "POST",
    body: { reason },
  });
}

export async function refundSale(saleId, payload) {
  return api(`/sales/${saleId}/refund`, {
    method: "POST",
    body: payload,
  });
}

export async function getSalesReport(filters = {}) {
  return api(withQuery("/sales/reports", filters), { method: "GET" });
}

export async function getCommercialEvents(filters = {}) {
  return api(withQuery("/sales/commercial-events", filters), { method: "GET" });
}

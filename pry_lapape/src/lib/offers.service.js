import { api } from "@/lib/api";

export async function getOffers() {
  return api("/offers", { method: "GET" });
}

export async function createOffer(payload) {
  return api("/offers", { method: "POST", body: payload });
}

export async function updateOffer(offerId, payload) {
  return api(`/offers/${offerId}`, { method: "PUT", body: payload });
}

export async function toggleOfferStatus(offerId) {
  return api(`/offers/${offerId}/toggle-status`, { method: "PATCH" });
}

// src/lib/storage.js
export const getLS = (k, def) => {
  if (typeof window === "undefined") return def;
  try {
    const raw = localStorage.getItem(k) ?? sessionStorage.getItem(k);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
};
export const setLS = (k, v, persistent = true) => {
  if (typeof window === "undefined") return;
  const store = persistent ? localStorage : sessionStorage;
  try { store.setItem(k, JSON.stringify(v)); } catch {}
};

export const authGet = () => getLS("auth", { logged: false, email: null });
export const authSet = (a) => setLS("auth", a);

export const cartGet = () => getLS("cart", []);
export const cartSet = (c) => setLS("cart", c);

export const checkoutGet = () => getLS("checkout", { address:null, shippingMethod:null, paymentMethod:null, paymentData:null });
export const checkoutSet = (c) => setLS("checkout", c);

export const ordersGet = () => getLS("orders", []);
export const ordersSet = (o) => setLS("orders", o);

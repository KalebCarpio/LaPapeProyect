"use client";
import { createContext, useContext, useState, useMemo } from "react";

const AuthCtx = createContext(null);
export function useAuth() { return useContext(AuthCtx); }

// ---- Helpers seguros en SSR/CSR
function readStoredAuth() {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const store = localStorage.getItem("user") ?? sessionStorage.getItem("user");
    const token = localStorage.getItem("token") ?? sessionStorage.getItem("token");
    return {
      user: store ? JSON.parse(store) : null,
      token: token || null,
    };
  } catch {
    return { user: null, token: null };
  }
}

export default function AuthProvider({ children }) {
  // Inicializamos estado directamente desde storage, sin useEffect
  const { user: initialUser, token: initialToken } = readStoredAuth();
  const [user, setUser]   = useState(initialUser);
  const [token, setToken] = useState(initialToken);

  const login = ({ user, token, remember = false }) => {
    const store = remember ? localStorage : sessionStorage;
    const otherStore = remember ? sessionStorage : localStorage;
    try {
      store.setItem("user", JSON.stringify(user));
      store.setItem("token", token);
      otherStore.removeItem("user");
      otherStore.removeItem("token");
    } catch {}
    setUser(user);
    setToken(token);
  };

  const logout = () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    } catch {}
    setUser(null);
    setToken(null);
  };

  const value = useMemo(() => ({ user, token, login, logout, loading: false }), [user, token]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

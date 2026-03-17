"use client";
import { useEffect, useState } from "react";

const KEYS = ["user", "usuario", "currentUser"];

function readFromStorage(storage) {
  for (const k of KEYS) {
    try {
      const raw = storage.getItem(k);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

function readUser() {
  if (typeof window === "undefined") return null;

  const localUser = readFromStorage(window.localStorage);
  if (localUser) return localUser;

  // fallback a sesión (ej. usuario eligió "no recordar")
  return readFromStorage(window.sessionStorage);
}

export default function useUser() {
  // hidrata sin setState dentro del effect
  const [user, setUser] = useState(() => readUser());

  // sincroniza si otra pestaña cambia el usuario
  useEffect(() => {
    const onStorage = (e) => {
      if (!e?.key || !KEYS.includes(e.key)) return;
      setUser(readUser());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // util de cierre de sesión
  const signOut = () => {
    try {
      KEYS.forEach((k) => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}
    window.location.href = "/login";
  };

  return { user, setUser, signOut };
}
// src/utils/validators.js

export const isEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isStrongPassword = (value) => {
  if (typeof value !== "string") return false;
  const password = value.trim();

  // Longitud mínima
  if (password.length < 8) return false;

  // Al menos: 1 mayúscula, 1 minúscula, 1 número y 1 símbolo
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasUpper && hasLower && hasDigit && hasSymbol;
};

export const isValidRole = (rol) =>
  typeof rol === "string" &&
  ["CLIENTE", "TRABAJADOR", "DUENO", "ADMIN"].includes(rol.toUpperCase());

export const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";


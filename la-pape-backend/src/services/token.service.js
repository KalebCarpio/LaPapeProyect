import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export function random6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Para contraseñas/códigos temporales comparables con bcrypt
export async function compareToken(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Para OTP/códigos de correo guardados de forma segura
export async function hashOtpToken(plain) {
  return bcrypt.hash(plain, 10);
}

// Para sesiones/JWT: hash estable y reproducible
export async function hashToken(plain) {
  return crypto.createHash("sha256").update(String(plain)).digest("hex");
}

export function expMinutes(minutes = 10) {
  const value = Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
  return new Date(Date.now() + value * 60 * 1000);
}

export function signAccessToken(user, options = {}) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.rol,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: options.expiresIn || "2h",
  });
}
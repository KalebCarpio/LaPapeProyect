// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { hashToken } from "../services/token.service.js";

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ error: "No autenticado" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload?.id || payload?.userId;

    if (!userId) return res.status(401).json({ error: "Token inválido" });

    const user = await User.findByPk(userId);
    if (!user) return res.status(401).json({ error: "Usuario no existe" });

    const tokenHash = await hashToken(token);
    const sessions = Array.isArray(user.sessions) ? user.sessions : [];
    const sessionIndex = sessions.findIndex((s) => s?.tokenHash === tokenHash);

    if (sessionIndex === -1) {
      return res.status(401).json({ error: "Sesión no válida (token no registrado)" });
    }

    req.user = user;
    req.auth = { sessionIndex, payload };
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
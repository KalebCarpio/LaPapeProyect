// src/middlewares/role.middleware.js
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role || req.user?.rol; // por si tu User usa "rol"

    if (!role) {
      return res.status(401).json({ error: "No autenticado (sin rol)" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "No autorizado (rol insuficiente)" });
    }

    next();
  };
}
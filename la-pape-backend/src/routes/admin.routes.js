import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/dashboard", authenticate, requireRole("ADMIN"), (req, res) => {
  res.json({ ok: true });
});

export default router;
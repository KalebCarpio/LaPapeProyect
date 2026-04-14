import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { getCommercialForecast } from "../controllers/forecast.controller.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "DUENO"));

router.get("/commercial", getCommercialForecast);

export default router;

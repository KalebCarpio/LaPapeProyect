import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createPosSale,
  listPosProducts,
  reprintPosTicket,
} from "../controllers/pos.controller.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "DUENO"));

router.get("/products", listPosProducts);
router.post("/sales", createPosSale);
router.post("/sales/:id/reprint", reprintPosTicket);

export default router;

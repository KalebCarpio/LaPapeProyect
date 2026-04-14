import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createCategory,
  getCategory,
  listCategories,
  toggleCategoryStatus,
  updateCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.get("/", listCategories);
router.get("/:id", getCategory);
router.post("/", authenticate, requireRole("ADMIN", "DUENO"), createCategory);
router.put("/:id", authenticate, requireRole("ADMIN", "DUENO"), updateCategory);
router.patch("/:id/toggle-status", authenticate, requireRole("ADMIN", "DUENO"), toggleCategoryStatus);

export default router;

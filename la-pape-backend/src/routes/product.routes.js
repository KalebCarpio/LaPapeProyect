// src/routes/products.routes.js
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  importProductsCsv,
  exportProductsCsv,
  downloadProductTemplate,
} from "../controllers/product.controller.js";

const router = Router();

// Público (catálogo)
router.get("/", listProducts);
router.get("/template", authenticate, requireRole("ADMIN", "DUENO"), downloadProductTemplate);
router.get("/export", authenticate, requireRole("ADMIN", "DUENO"), exportProductsCsv);
router.get("/:id", getProduct);

// Admin/Dueño
router.post("/", authenticate, requireRole("ADMIN", "DUENO"), createProduct);
router.post("/import", authenticate, requireRole("ADMIN", "DUENO"), importProductsCsv);
router.put("/:id", authenticate, requireRole("ADMIN", "DUENO"), updateProduct);
router.patch("/:id/toggle-status", authenticate, requireRole("ADMIN", "DUENO"), toggleProductStatus);
router.delete("/:id", authenticate, requireRole("ADMIN", "DUENO"), deleteProduct);

export default router;

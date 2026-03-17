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
} from "../controllers/product.controller.js";

const router = Router();

// Público (catálogo)
router.get("/", listProducts);
router.get("/:id", getProduct);

// Admin/Dueño
router.post("/", authenticate, requireRole("ADMIN", "DUENO"), createProduct);
router.put("/:id", authenticate, requireRole("ADMIN", "DUENO"), updateProduct);
router.delete("/:id", authenticate, requireRole("ADMIN", "DUENO"), deleteProduct);

export default router;
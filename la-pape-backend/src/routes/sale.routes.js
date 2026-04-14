import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  cancelSale,
  createSale,
  getSale,
  getSalesReport,
  listBranchProducts,
  listCommercialEvents,
  listSales,
  refundSale,
  reprintSaleTicket,
} from "../controllers/sale.controller.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "DUENO"));

router.get("/branch-products", listBranchProducts);
router.get("/reports", getSalesReport);
router.get("/commercial-events", listCommercialEvents);
router.get("/", listSales);
router.get("/:id", getSale);
router.post("/", createSale);
router.post("/:id/reprint", reprintSaleTicket);
router.post("/:id/cancel", cancelSale);
router.post("/:id/refund", refundSale);

export default router;

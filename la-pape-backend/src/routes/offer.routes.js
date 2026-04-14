import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createOffer,
  getOffer,
  listOffers,
  toggleOfferStatus,
  updateOffer,
} from "../controllers/offer.controller.js";

const router = Router();

router.get("/", listOffers);
router.get("/:id", getOffer);
router.post("/", authenticate, requireRole("ADMIN", "DUENO"), createOffer);
router.put("/:id", authenticate, requireRole("ADMIN", "DUENO"), updateOffer);
router.patch("/:id/toggle-status", authenticate, requireRole("ADMIN", "DUENO"), toggleOfferStatus);

export default router;

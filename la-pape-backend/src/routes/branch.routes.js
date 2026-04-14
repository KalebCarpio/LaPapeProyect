import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { listBranches } from "../controllers/branch.controller.js";

const router = Router();

router.get("/", authenticate, requireRole("ADMIN", "DUENO"), listBranches);

export default router;

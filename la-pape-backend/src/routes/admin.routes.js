import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  createFullBackupHandler,
  createMultipleTablesBackupHandler,
  createSingleTableBackupHandler,
  deleteBackupHandler,
  downloadBackupHandler,
  getBackupHistory,
  getTables,
} from "../controllers/backup.controller.js";
import {
  getDatabaseMonitorSummaryHandler,
  getDatabaseMonitorTablesHandler,
  refreshDatabaseMonitorHandler,
} from "../controllers/database-monitor.controller.js";

const router = Router();

router.get("/dashboard", authenticate, requireRole("ADMIN", "DUENO"), (req, res) => {
  res.json({ ok: true });
});

router.get("/backups/tables", authenticate, requireRole("ADMIN", "DUENO"), getTables);
router.get("/backups", authenticate, requireRole("ADMIN", "DUENO"), getBackupHistory);
router.post("/backups/full", authenticate, requireRole("ADMIN", "DUENO"), createFullBackupHandler);
router.post("/backups/table", authenticate, requireRole("ADMIN", "DUENO"), createSingleTableBackupHandler);
router.post("/backups/tables", authenticate, requireRole("ADMIN", "DUENO"), createMultipleTablesBackupHandler);
router.get("/backups/:id/download", authenticate, requireRole("ADMIN", "DUENO"), downloadBackupHandler);
router.delete("/backups/:id", authenticate, requireRole("ADMIN", "DUENO"), deleteBackupHandler);
router.get("/database-monitor/summary", authenticate, requireRole("ADMIN", "DUENO"), getDatabaseMonitorSummaryHandler);
router.get("/database-monitor/tables", authenticate, requireRole("ADMIN", "DUENO"), getDatabaseMonitorTablesHandler);
router.get("/database-monitor/refresh", authenticate, requireRole("ADMIN", "DUENO"), refreshDatabaseMonitorHandler);

export default router;

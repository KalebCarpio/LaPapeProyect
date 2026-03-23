import {
  getDatabaseMonitorSummary,
  getDatabaseMonitorTables,
} from "../services/database-monitor.service.js";

function sendError(res, error, status = 500) {
  return res.status(status).json({
    ok: false,
    error: error.message || "No se pudo obtener el monitoreo de la base de datos.",
  });
}

export async function getDatabaseMonitorSummaryHandler(_req, res) {
  try {
    const summary = await getDatabaseMonitorSummary();
    return res.json({ ok: true, summary });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getDatabaseMonitorTablesHandler(_req, res) {
  try {
    const tables = await getDatabaseMonitorTables();
    return res.json({ ok: true, tables });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function refreshDatabaseMonitorHandler(_req, res) {
  try {
    const [summary, tables] = await Promise.all([
      getDatabaseMonitorSummary(),
      getDatabaseMonitorTables(),
    ]);

    return res.json({ ok: true, summary, tables });
  } catch (error) {
    return sendError(res, error);
  }
}

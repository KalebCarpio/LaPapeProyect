import {
  createFullBackup,
  createMultipleTablesBackup,
  createSingleTableBackup,
  deleteBackupLogAndFile,
  getBackupFilePath,
  getBackupLogById,
  listAvailableTables,
  listBackupLogs,
} from "../services/backup.service.js";

function sendError(res, error, status = 400) {
  return res.status(status).json({
    ok: false,
    error: error.message || "Ocurrió un error inesperado",
  });
}

export async function getTables(_req, res) {
  try {
    const tables = await listAvailableTables();
    return res.json({ ok: true, tables });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

export async function createFullBackupHandler(_req, res) {
  try {
    const backup = await createFullBackup();
    return res.status(201).json({ ok: true, backup });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

export async function createSingleTableBackupHandler(req, res) {
  try {
    const table = String(req.body?.table || "").trim();
    if (!table) {
      return sendError(res, new Error("Debes seleccionar una tabla."), 400);
    }

    const backup = await createSingleTableBackup(table);
    return res.status(201).json({ ok: true, backup });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

export async function createMultipleTablesBackupHandler(req, res) {
  try {
    const tables = Array.isArray(req.body?.tables) ? req.body.tables : [];
    if (tables.length === 0) {
      return sendError(res, new Error("Debes seleccionar una o más tablas."), 400);
    }

    const backup = await createMultipleTablesBackup(tables);
    return res.status(201).json({ ok: true, backup });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

export async function getBackupHistory(_req, res) {
  try {
    const backups = await listBackupLogs();
    return res.json({ ok: true, backups });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

export async function downloadBackupHandler(req, res) {
  try {
    const backup = await getBackupLogById(req.params.id);
    if (!backup) {
      return sendError(res, new Error("No se encontró el respaldo solicitado."), 404);
    }

    return res.download(getBackupFilePath(backup), backup.fileName);
  } catch (error) {
    return sendError(res, error, 500);
  }
}

export async function deleteBackupHandler(req, res) {
  try {
    const backup = await deleteBackupLogAndFile(req.params.id);
    return res.json({ ok: true, backup });
  } catch (error) {
    return sendError(res, error, 500);
  }
}

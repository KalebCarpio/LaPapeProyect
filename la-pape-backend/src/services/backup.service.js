import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma.js";

const BACKUP_TYPES = {
  FULL: "COMPLETO",
  SINGLE: "UNA_TABLA",
  MULTIPLE: "VARIAS_TABLAS",
};

function getDbConfig() {
  return {
    host: process.env.DB_HOST || process.env.PG_HOST || "localhost",
    port: process.env.DB_PORT || process.env.PG_PORT || "5432",
    database: process.env.DB_NAME || process.env.PG_DATABASE,
    user: process.env.DB_USER || process.env.PG_USER,
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD,
  };
}

function getBackupDir() {
  const configured = (process.env.BACKUP_DIR || "").trim();
  return configured || path.resolve(process.cwd(), "storage", "backups");
}

async function ensureBackupDir() {
  const backupDir = getBackupDir();
  await fs.mkdir(backupDir, { recursive: true });
  return backupDir;
}

function stampForFile(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "_",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function cleanTableName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

function buildBackupFileName(type, tables = []) {
  const stamp = stampForFile();

  if (type === BACKUP_TYPES.FULL) {
    return `lapape_backup_completo_${stamp}.tar`;
  }

  if (type === BACKUP_TYPES.SINGLE) {
    return `lapape_${cleanTableName(tables[0])}_backup_${stamp}.tar`;
  }

  const sanitized = tables.map(cleanTableName).filter(Boolean);
  const base =
    sanitized.join("_").length > 60
      ? `${sanitized.slice(0, 3).join("_")}_y_${Math.max(0, sanitized.length - 3)}_mas`
      : sanitized.join("_");

  return `lapape_tablas_${base}_backup_${stamp}.tar`;
}

function serializeBackupLog(item) {
  return {
    id: item.id,
    backupType: item.backupType,
    fileName: item.fileName,
    includedTables: Array.isArray(item.includedTables) ? item.includedTables : [],
    filePath: item.filePath,
    fileSize: Number(item.fileSize || 0),
    status: item.status,
    fecha: item.fecha,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    descripcion: item.descripcion || "",
  };
}

async function createBackupLog(data) {
  const created = await prisma.backupLog.create({
    data,
  });

  return serializeBackupLog(created);
}

function runPgDump({ outputPath, tables = [] }) {
  const db = getDbConfig();

  if (!db.database || !db.user) {
    throw new Error("Faltan credenciales de base de datos para generar el respaldo.");
  }

  const args = [
    "-h",
    db.host,
    "-p",
    String(db.port),
    "-U",
    db.user,
    "-d",
    db.database,
    "-F",
    "t",
    "-f",
    outputPath,
    "--no-owner",
    "--no-privileges",
  ];

  for (const table of tables) {
    args.push("-t", table);
  }

  const env = {
    ...process.env,
    PGPASSWORD: db.password || "",
  };

  return new Promise((resolve, reject) => {
    const dump = spawn("pg_dump", args, { env });
    let stderr = "";

    dump.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    dump.on("error", (error) => {
      reject(
        new Error(
          `No se pudo ejecutar pg_dump. Asegúrate de tener PostgreSQL CLI instalada. ${error.message}`
        )
      );
    });

    dump.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || "pg_dump falló al generar el respaldo."));
        return;
      }

      resolve();
    });
  });
}

async function getExistingTablesSet() {
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `;

  return new Set(rows.map((row) => row.table_name));
}

async function createBackup({ backupType, tables = [] }) {
  const includedTables = tables.map(cleanTableName).filter(Boolean);
  const backupDir = await ensureBackupDir();
  const fileName = buildBackupFileName(backupType, includedTables);
  const filePath = path.join(backupDir, fileName);

  try {
    await runPgDump({
      outputPath: filePath,
      tables: includedTables,
    });

    const stat = await fs.stat(filePath);
    return await createBackupLog({
      backupType,
      fileName,
      includedTables,
      filePath,
      fileSize: BigInt(stat.size),
      status: "GENERADO",
      descripcion:
        backupType === BACKUP_TYPES.FULL
          ? "Respaldo completo de la base de datos"
          : `Respaldo generado para ${includedTables.join(", ")}`,
    });
  } catch (error) {
    await fs.rm(filePath, { force: true }).catch(() => undefined);

    await createBackupLog({
      backupType,
      fileName,
      includedTables,
      filePath,
      fileSize: BigInt(0),
      status: "ERROR",
      descripcion: error.message,
    });

    throw error;
  }
}

export async function listAvailableTables() {
  const rows = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `;

  return rows.map((row) => row.table_name);
}

export async function createFullBackup() {
  return createBackup({ backupType: BACKUP_TYPES.FULL });
}

export async function createSingleTableBackup(tableName) {
  const cleanName = cleanTableName(tableName);
  const tables = await getExistingTablesSet();

  if (!cleanName || !tables.has(cleanName)) {
    throw new Error("La tabla seleccionada no existe en la base de datos.");
  }

  return createBackup({
    backupType: BACKUP_TYPES.SINGLE,
    tables: [cleanName],
  });
}

export async function createMultipleTablesBackup(tableNames) {
  const cleanNames = [...new Set((tableNames || []).map(cleanTableName).filter(Boolean))];

  if (cleanNames.length === 0) {
    throw new Error("Debes seleccionar al menos una tabla para generar el respaldo.");
  }

  const tables = await getExistingTablesSet();
  const invalid = cleanNames.filter((table) => !tables.has(table));

  if (invalid.length > 0) {
    throw new Error(`Tabla(s) inválida(s): ${invalid.join(", ")}`);
  }

  return createBackup({
    backupType: BACKUP_TYPES.MULTIPLE,
    tables: cleanNames,
  });
}

export async function listBackupLogs() {
  const items = await prisma.backupLog.findMany({
    orderBy: { fecha: "desc" },
  });

  return items.map(serializeBackupLog);
}

export async function getBackupLogById(backupId) {
  const item = await prisma.backupLog.findUnique({
    where: { id: backupId },
  });

  return item ? serializeBackupLog(item) : null;
}

export async function deleteBackupLogAndFile(backupId) {
  const item = await prisma.backupLog.findUnique({
    where: { id: backupId },
  });

  if (!item) {
    throw new Error("No se encontró el respaldo solicitado.");
  }

  await fs.rm(item.filePath, { force: true }).catch(() => undefined);
  await prisma.backupLog.delete({
    where: { id: backupId },
  });

  return serializeBackupLog(item);
}

export function getBackupFilePath(backupLog) {
  return backupLog.filePath;
}

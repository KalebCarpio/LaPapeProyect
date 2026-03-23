import { prisma } from "../lib/prisma.js";

function formatBytes(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = numeric;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function toSafeIdentifier(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(normalized)) {
    throw new Error(`Nombre de tabla inválido: ${value}`);
  }
  return normalized;
}

function toDisplayName(tableName) {
  const customLabels = {
    users: "Usuarios",
    products: "Productos",
    categories: "Categorías",
    brands: "Marcas",
    suppliers: "Proveedores",
    customers: "Clientes",
    sales: "Ventas",
    sale_details: "Detalle de ventas",
    inventory_movements: "Movimientos de inventario",
    branches: "Sucursales",
    branch_stock: "Stock por sucursal",
    backup_logs: "Historial de respaldos",
    system_audit_logs: "Bitácora del sistema",
    promotions: "Promociones",
    reviews: "Reseñas",
  };

  if (customLabels[tableName]) return customLabels[tableName];

  return tableName
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeMaintenanceDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() <= 1970) return null;
  return date.toISOString();
}

async function getDatabaseMeta() {
  const [versionRows, dbStatsRows, connectionsRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT version() AS version
    `,
    prisma.$queryRaw`
      SELECT
        current_database() AS "databaseName",
        current_schema() AS "schemaName",
        pg_database_size(current_database()) AS "databaseSizeBytes",
        (
          SELECT COALESCE(xact_commit + xact_rollback, 0)
          FROM pg_stat_database
          WHERE datname = current_database()
        ) AS "totalTransactions",
        pg_postmaster_start_time() AS "startedAt"
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS "activeConnections"
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'active'
    `,
  ]);

  const versionRow = versionRows[0] || {};
  const statsRow = dbStatsRows[0] || {};
  const connectionsRow = connectionsRows[0] || {};

  return {
    databaseName: statsRow.databaseName || "No disponible",
    schemaName: statsRow.schemaName || "public",
    databaseSizeBytes: Number(statsRow.databaseSizeBytes || 0),
    totalTransactions: Number(statsRow.totalTransactions || 0),
    startedAt: statsRow.startedAt || null,
    activeConnections: Number(connectionsRow.activeConnections || 0),
    postgresVersion: versionRow.version || "No disponible",
  };
}

async function getTableBaseRows() {
  const rows = await prisma.$queryRaw`
    SELECT
      t.table_name AS "tableName",
      COALESCE(s.n_live_tup, 0)::bigint AS "estimatedRows",
      pg_total_relation_size(format('%I.%I', t.table_schema, t.table_name)::regclass) AS "totalSizeBytes",
      GREATEST(
        COALESCE(s.last_vacuum, 'epoch'::timestamp),
        COALESCE(s.last_autovacuum, 'epoch'::timestamp),
        COALESCE(s.last_analyze, 'epoch'::timestamp),
        COALESCE(s.last_autoanalyze, 'epoch'::timestamp)
      ) AS "lastMaintainedAt"
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s
      ON s.schemaname = t.table_schema
      AND s.relname = t.table_name
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY pg_total_relation_size(format('%I.%I', t.table_schema, t.table_name)::regclass) DESC,
             t.table_name ASC
  `;

  return rows.map((row) => ({
    tableName: row.tableName,
    estimatedRows: Number(row.estimatedRows || 0),
    totalSizeBytes: Number(row.totalSizeBytes || 0),
    lastMaintainedAt: normalizeMaintenanceDate(row.lastMaintainedAt),
  }));
}

async function getExactRowCount(tableName) {
  const safeTable = toSafeIdentifier(tableName);
  const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS "count" FROM public."${safeTable}"`);
  return Number(rows?.[0]?.count || 0);
}

async function getTablesWithStats() {
  const baseRows = await getTableBaseRows();

  const tables = await Promise.all(
    baseRows.map(async (row, index) => {
      const rowCount = await getExactRowCount(row.tableName).catch(() => row.estimatedRows);

      return {
        index: index + 1,
        displayName: toDisplayName(row.tableName),
        tableName: row.tableName,
        rowCount,
        totalSizeBytes: row.totalSizeBytes,
        totalSize: formatBytes(row.totalSizeBytes),
        status: "Conectada",
        lastUpdatedAt: row.lastMaintainedAt,
      };
    })
  );

  tables.sort((a, b) => {
    if (b.totalSizeBytes !== a.totalSizeBytes) return b.totalSizeBytes - a.totalSizeBytes;
    if (b.rowCount !== a.rowCount) return b.rowCount - a.rowCount;
    return a.tableName.localeCompare(b.tableName);
  });

  return tables.map((table, index) => ({
    ...table,
    index: index + 1,
  }));
}

export async function getDatabaseMonitorSummary() {
  const [meta, tables] = await Promise.all([getDatabaseMeta(), getTablesWithStats()]);

  const totalRows = tables.reduce((sum, table) => sum + Number(table.rowCount || 0), 0);
  const largestTable = tables[0] || null;
  const tableWithMostRows = [...tables].sort((a, b) => b.rowCount - a.rowCount)[0] || null;

  const status = meta.databaseName === "No disponible"
    ? "No disponible"
    : meta.activeConnections >= 0
      ? "Conectada"
      : "Con advertencias";

  return {
    databaseName: meta.databaseName,
    status,
    totalTables: tables.length,
    totalRows,
    totalSize: formatBytes(meta.databaseSizeBytes),
    totalSizeBytes: meta.databaseSizeBytes,
    postgresVersion: meta.postgresVersion,
    uptime: meta.startedAt
      ? Math.max(0, Date.now() - new Date(meta.startedAt).getTime())
      : null,
    activeConnections: meta.activeConnections,
    totalTransactions: meta.totalTransactions,
    largestTable: largestTable?.displayName || "No disponible",
    largestTableName: largestTable?.tableName || null,
    largestTableSize: largestTable?.totalSize || "0 B",
    largestTableSizeBytes: largestTable?.totalSizeBytes || 0,
    tableWithMostRows: tableWithMostRows?.displayName || "No disponible",
    tableWithMostRowsName: tableWithMostRows?.tableName || null,
    tableWithMostRowsCount: tableWithMostRows?.rowCount || 0,
    schemaName: meta.schemaName,
    lastCheckedAt: new Date().toISOString(),
  };
}

export async function getDatabaseMonitorTables() {
  return getTablesWithStats();
}

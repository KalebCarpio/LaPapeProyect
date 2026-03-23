import { api } from "@/lib/api";

export async function getDatabaseMonitorSummary() {
  const res = await api("/admin/database-monitor/summary", { method: "GET" });
  return res.summary || null;
}

export async function getDatabaseMonitorTables() {
  const res = await api("/admin/database-monitor/tables", { method: "GET" });
  return res.tables || [];
}

export async function refreshDatabaseMonitor() {
  const res = await api("/admin/database-monitor/refresh", { method: "GET" });
  return {
    summary: res.summary || null,
    tables: res.tables || [],
  };
}

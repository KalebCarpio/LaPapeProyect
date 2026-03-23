import { api, apiURL } from "@/lib/api";

function getAuthToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

export async function getBackupTables() {
  const res = await api("/admin/backups/tables", { method: "GET" });
  return res.tables || [];
}

export async function getBackupHistory() {
  const res = await api("/admin/backups", { method: "GET" });
  return res.backups || [];
}

export async function generateFullBackup() {
  const res = await api("/admin/backups/full", { method: "POST" });
  return res.backup;
}

export async function generateSingleTableBackup(table) {
  const res = await api("/admin/backups/table", {
    method: "POST",
    body: { table },
  });
  return res.backup;
}

export async function generateMultipleTablesBackup(tables) {
  const res = await api("/admin/backups/tables", {
    method: "POST",
    body: { tables },
  });
  return res.backup;
}

export async function deleteBackup(backupId) {
  const res = await api(`/admin/backups/${backupId}`, { method: "DELETE" });
  return res.backup;
}

export async function downloadBackup(backupId, fileName) {
  const token = getAuthToken();
  const response = await fetch(apiURL(`/admin/backups/${backupId}/download`), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let message = "No se pudo descargar el respaldo";
    try {
      const data = await response.json();
      message = data?.error || data?.message || message;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "lapape_backup.tar";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

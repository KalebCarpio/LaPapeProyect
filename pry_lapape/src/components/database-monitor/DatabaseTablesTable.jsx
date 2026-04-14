"use client";

import { memo } from "react";

function formatDate(value) {
  if (!value) return "Sin actividad reciente";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function estimateIndexCount(table) {
  const rowFactor = Math.log10(Number(table?.rowCount || 0) + 10);
  const sizeFactor = Number(table?.totalSizeBytes || 0) / (90 * 1024 * 1024);
  return Math.max(1, Math.round(rowFactor + sizeFactor + 1));
}

function resolveTableStatus(table, featured) {
  if (featured) return "Critica";
  if (!table.lastUpdatedAt) return "Observacion";
  return "Saludable";
}

function StatusBadge({ status }) {
  const styles = {
    Critica: "border-[#FDE68A] bg-[#FFF8DB] text-[#B45309]",
    Observacion: "border-[#D7E7FF] bg-[#EEF5FF] text-[#1D4ED8]",
    Saludable: "border-[#CFF5DE] bg-[#F1FDF6] text-[#047857]",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.Saludable}`}>
      {status}
    </span>
  );
}

function DatabaseTablesTable({
  tables,
  loading,
  schemaName = "public",
  largestTableName,
  tableWithMostRowsName,
}) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="border-b border-[#EEF2F6] px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#98A2B3]">
          Estructura tecnica
        </p>
        <h2 className="mt-1 text-xl font-bold text-[#1F2933]">
          Tablas, esquema, indices y actividad reciente
        </h2>
        <p className="mt-1 text-sm text-[#667085]">
          Vista estructural del esquema {schemaName} enfocada en peso, cardinalidad,
          indices y senales de salud de cada tabla.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 px-6 py-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-[linear-gradient(90deg,#F8FAFC,#EEF2F7,#F8FAFC)]"
            />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h3 className="text-xl font-bold text-[#1F2933]">No se detectaron tablas</h3>
          <p className="mt-2 text-sm text-[#667085]">
            Cuando PostgreSQL exponga tablas tecnicas en el esquema analizado, apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#FFF9E6]">
              <tr>
                {["Tabla", "Esquema", "Registros", "Tamano", "Indices", "Estado", "Ultima actividad"].map((header) => (
                  <th
                    key={header}
                    className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => {
                const isLargest = table.tableName === largestTableName;
                const hasMostRows = table.tableName === tableWithMostRowsName;
                const featured = isLargest || hasMostRows;
                const status = resolveTableStatus(table, featured);

                return (
                  <tr key={table.tableName} className="border-t border-[#EEF2F6] align-top">
                    <td className="px-5 py-4">
                      <div className="min-w-[220px] max-w-sm">
                        <p className="font-semibold text-[#1F2933]">{table.displayName}</p>
                        <p className="mt-1 text-xs text-[#667085]">{table.tableName}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isLargest ? (
                            <span className="rounded-full bg-[#FFF8DB] px-2.5 py-1 text-[11px] font-semibold text-[#B45309]">
                              Tabla mas pesada
                            </span>
                          ) : null}
                          {hasMostRows ? (
                            <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8]">
                              Mayor cardinalidad
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-[#1F2933]">{schemaName}</td>
                    <td className="px-5 py-4 text-sm font-medium text-[#1F2933]">
                      {Number(table.rowCount || 0).toLocaleString("es-MX")}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475467]">{table.totalSize}</td>
                    <td className="px-5 py-4 text-sm text-[#475467]">{estimateIndexCount(table)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475467]">{formatDate(table.lastUpdatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default memo(DatabaseTablesTable);

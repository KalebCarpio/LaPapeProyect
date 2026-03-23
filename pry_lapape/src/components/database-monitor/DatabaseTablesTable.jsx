"use client";

function formatDate(value) {
  if (!value) return "No disponible";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status, featured }) {
  const base = featured
    ? "border-[#FFE9A8] bg-[#FFF7D6] text-[#A16207]"
    : "border-[#D7E7FF] bg-[#EEF5FF] text-[#1D6FD1]";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${base}`}>
      {status}
    </span>
  );
}

export default function DatabaseTablesTable({
  tables,
  loading,
  largestTableName,
  tableWithMostRowsName,
}) {
  return (
    <section className="rounded-3xl border border-[#E5E7EB] bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="border-b border-[#F1F5F9] px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
          Tablas detectadas
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#1F2933]">Estructura actual del esquema público</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Resumen de tamaño, registros y actividad reciente por tabla de La Pape.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 px-6 py-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-[linear-gradient(90deg,#F8FAFC,#EEF2F7,#F8FAFC)]"
            />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h3 className="text-xl font-bold text-[#1F2933]">No se detectaron tablas</h3>
          <p className="mt-2 text-sm text-[#6B7280]">
            Cuando PostgreSQL exponga tablas en el esquema público, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#FFF9E6]">
              <tr>
                {["#", "Tabla", "Registros", "Tamaño", "Estado", "Última actualización"].map((header) => (
                  <th
                    key={header}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]"
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

                return (
                  <tr key={table.tableName} className="border-t border-[#F1F5F9] align-top">
                    <td className="px-5 py-4 text-sm font-semibold text-[#6B7280]">{table.index}</td>
                    <td className="px-5 py-4">
                      <div className="max-w-sm">
                        <p className="font-semibold text-[#1F2933]">{table.displayName}</p>
                        <p className="mt-1 text-xs text-[#6B7280]">{table.tableName}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isLargest ? (
                            <span className="rounded-full bg-[#FFF7D6] px-2.5 py-1 text-[11px] font-semibold text-[#A16207]">
                              Tabla más pesada
                            </span>
                          ) : null}
                          {hasMostRows ? (
                            <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-[11px] font-semibold text-[#1D6FD1]">
                              Más registros
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#1F2933]">
                      {Number(table.rowCount || 0).toLocaleString("es-MX")}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">{table.totalSize}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={table.status} featured={featured} />
                    </td>
                    <td className="px-5 py-4 text-sm text-[#374151]">{formatDate(table.lastUpdatedAt)}</td>
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

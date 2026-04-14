"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  LineChart,
  PackageSearch,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import RoleLayout from "@/components/RoleLayout";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import {
  CommercialEmptyState,
  CommercialFilterCard,
  CommercialHero,
  CommercialPanel,
  CommercialSummaryGrid,
} from "@/components/commercial/CommercialUI";
import { getBranches } from "@/lib/branches.service";
import { getCategories } from "@/lib/categories.service";
import { getCommercialForecast } from "@/lib/forecast.service";
import { getProducts } from "@/lib/products.service";

const LOOKBACK_OPTIONS = [
  { value: "14", label: "14 dias" },
  { value: "30", label: "30 dias" },
  { value: "45", label: "45 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
  { value: "120", label: "120 dias" },
  { value: "180", label: "180 dias" },
];

const HORIZON_OPTIONS = [
  { value: "7", label: "7 dias" },
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "3 meses" },
  { value: "180", label: "6 meses" },
  { value: "365", label: "1 año" },
];

const DEFAULT_DEMO_CASE = {
  branchName: "Sucursal Centro",
  productSku: "LAP-CUA-001",
  lookbackDays: "60",
  horizonDays: "30",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function roundWhole(value) {
  return Math.round(Number(value || 0));
}

function formatExact(value, digits = 1) {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value || 0));
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
}

function granularityLabel(granularity) {
  if (granularity === "month") return "mensual";
  if (granularity === "week") return "semanal";
  return "diaria";
}

function xAxisLabel(granularity) {
  if (granularity === "month") return "Meses";
  if (granularity === "week") return "Semanas";
  return "Fechas";
}

function formatShortDayMonth(input, withLeadingZero = true) {
  if (!input) return "";
  const date = new Date(`${input}T00:00:00.000Z`);
  const day = new Intl.DateTimeFormat("es-MX", {
    day: withLeadingZero ? "2-digit" : "numeric",
    timeZone: "UTC",
  }).format(date);
  const month = new Intl.DateTimeFormat("es-MX", {
    month: "short",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "")
    .toLowerCase();

  return `${day} ${month}`;
}

function formatDayRange(startLabel, endLabel) {
  if (!startLabel || !endLabel) return "Sin datos";

  const start = new Date(`${startLabel}T00:00:00.000Z`);
  const end = new Date(`${endLabel}T00:00:00.000Z`);
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  const startDay = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    timeZone: "UTC",
  }).format(start);

  const endDay = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    timeZone: "UTC",
  }).format(end);

  const startMonth = new Intl.DateTimeFormat("es-MX", {
    month: "short",
    timeZone: "UTC",
  })
    .format(start)
    .replace(".", "")
    .toLowerCase();

  const endMonth = new Intl.DateTimeFormat("es-MX", {
    month: "short",
    timeZone: "UTC",
  })
    .format(end)
    .replace(".", "")
    .toLowerCase();

  if (startLabel === endLabel) {
    return `${startDay} ${startMonth}`;
  }

  if (sameMonth) {
    return `${startDay}–${endDay} ${endMonth}`;
  }

  return `${startDay} ${startMonth}–${endDay} ${endMonth}`;
}

function formatPeriodLabel(label, granularity) {
  if (!label) return "";

  if (granularity === "day") {
    return formatShortDayMonth(label, true);
  }

  if (granularity === "month") {
    const [year, month] = label.split("-");
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    return new Intl.DateTimeFormat("es-MX", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }

  return label.replace("-W", " sem ");
}

function renderUnitMetric(value, suffix = "pzs") {
  return (
    <div>
      <div className="text-3xl font-extrabold text-[#1F2933]">{roundWhole(value)} {suffix}</div>
      <div className="mt-1 text-xs font-medium text-[#6B7280]">{formatExact(value)} exactas</div>
    </div>
  );
}

function renderDaysMetric(value) {
  if (value === null || value === undefined) {
    return (
      <div>
        <div className="text-3xl font-extrabold text-[#1F2933]">Sin dato</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-3xl font-extrabold text-[#1F2933]">{roundWhole(value)} días</div>
      <div className="mt-1 text-xs font-medium text-[#6B7280]">{formatExact(value)} exactos</div>
    </div>
  );
}

function renderTableUnit(value) {
  return (
    <div>
      <div className="font-semibold text-[#1F2933]">{roundWhole(value)} pzs</div>
      <div className="mt-1 text-xs text-[#6B7280]">{formatExact(value)} exactas</div>
    </div>
  );
}

function renderTableDays(value) {
  if (value === null || value === undefined) {
    return <span className="text-sm text-[#6B7280]">Sin dato</span>;
  }

  return (
    <div>
      <div className="font-semibold text-[#1F2933]">{roundWhole(value)} días</div>
      <div className="mt-1 text-xs text-[#6B7280]">{formatExact(value)} exactos</div>
    </div>
  );
}

function rangeLabel(series, granularity) {
  if (!series?.length) return "Sin datos";
  const first = series[0]?.periodLabel || "";
  const last = series[series.length - 1]?.periodLabel || "";

  if (granularity === "day") {
    return formatDayRange(first, last);
  }

  return first === last ? first : `${first} a ${last}`;
}

function CompactLineChart({ historical, projected, chartGranularity }) {
  const points = [
    ...historical.map((item) => ({ x: item.periodLabel, y: item.units, type: "historical" })),
    ...projected.map((item) => ({ x: item.periodLabel, y: item.projectedUnits, type: "projected" })),
  ];
  const maxValue = Math.max(...points.map((item) => Number(item.y || 0)), 1);
  const tickValues = Array.from({ length: 5 }, (_, index) => round(maxValue - ((maxValue * index) / 4), 0));
  const width = 920;
  const height = 260;
  const padding = 36;
  const historicalLength = historical.length || 1;
  const totalLength = points.length || 1;
  const splitX = padding + ((width - padding * 2) * Math.max(historicalLength - 1, 0)) / Math.max(totalLength - 1, 1);

  const buildPoint = (value, index) => {
    const x = padding + ((width - padding * 2) * index) / Math.max(totalLength - 1, 1);
    const y = height - padding - ((height - padding * 2) * Number(value || 0)) / maxValue;
    return `${x},${y}`;
  };

  const historicalPolyline = historical.map((item, index) => buildPoint(item.units, index)).join(" ");
  const projectedPolyline = projected
    .map((item, index) => buildPoint(item.projectedUnits, historicalLength - 1 + index))
    .join(" ");
  const historicalRange = rangeLabel(historical, chartGranularity);
  const projectedRange = rangeLabel(projected, chartGranularity);
  const xTicks = [];
  const allSeries = [...historical, ...projected];
  const candidateIndexes = Array.from(new Set([
    0,
    Math.max(historicalLength - 1, 0),
    Math.max(Math.floor((historicalLength - 1) / 2), 0),
    Math.max(totalLength - 1, 0),
    Math.max(historicalLength + Math.floor((projected.length - 1) / 2), historicalLength - 1),
  ]))
    .filter((index) => index >= 0 && index < allSeries.length)
    .sort((a, b) => a - b);

  for (const index of candidateIndexes) {
    const item = allSeries[index];
    if (!item) continue;
    xTicks.push({
      index,
      label: formatPeriodLabel(item.periodLabel, chartGranularity),
    });
  }

  return (
    <div className="overflow-x-auto px-6 py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 text-sm">
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Eje X</p>
          <p className="mt-1 font-semibold text-[#1F2933]">{xAxisLabel(chartGranularity)}</p>
          <p className="mt-1 text-[#6B7280]">{historicalRange} (histórico)</p>
          <p className="mt-1 text-[#6B7280]">{projectedRange} (proyección)</p>
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Eje Y</p>
          <p className="mt-1 font-semibold text-[#1F2933]">Piezas vendidas</p>
          <p className="mt-1 text-[#6B7280]">Volumen en {granularityLabel(chartGranularity)}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
        <defs>
          <linearGradient id="historicalFill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#1D6FD1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1D6FD1" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="forecastFill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {Array.from({ length: 5 }).map((_, index) => {
          const y = padding + ((height - padding * 2) * index) / 4;
          return (
            <g key={index}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="4 6"
              />
              <text x={8} y={y + 4} fill="#94A3B8" fontSize="11">{tickValues[index]} pzs</text>
            </g>
          );
        })}

        {historical.length > 1 ? (
          <polygon
            fill="url(#historicalFill)"
            points={[
              historical.map((item, index) => buildPoint(item.units, index)).join(" "),
              `${splitX},${height - padding}`,
              `${padding},${height - padding}`,
            ].join(" ")}
          />
        ) : null}

        {projected.length > 0 ? (
          <line
            x1={splitX}
            y1={padding}
            x2={splitX}
            y2={height - padding}
            stroke="#CBD5E1"
            strokeDasharray="6 6"
          />
        ) : null}

        {historicalPolyline ? (
          <polyline
            fill="none"
            stroke="#1D6FD1"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={historicalPolyline}
          />
        ) : null}

        {projectedPolyline ? (
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3"
            strokeDasharray="8 6"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={projectedPolyline}
          />
        ) : null}

        {projected.length > 0 ? (
          <polygon
            fill="url(#forecastFill)"
            points={[
              buildPoint(projected[0].projectedUnits, historicalLength - 1),
              projected.map((item, index) => buildPoint(item.projectedUnits, historicalLength - 1 + index)).join(" "),
              `${width - padding},${height - padding}`,
              `${padding + ((width - padding * 2) * (historicalLength - 1)) / Math.max(totalLength - 1, 1)},${height - padding}`,
            ].join(" ")}
          />
        ) : null}

        {historical.length > 0 ? (
          <circle
            cx={splitX}
            cy={height - padding - ((height - padding * 2) * Number(historical[historical.length - 1].units || 0)) / maxValue}
            r="4.5"
            fill="#1D6FD1"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ) : null}

        {projected.length > 0 ? (
          <circle
            cx={splitX}
            cy={height - padding - ((height - padding * 2) * Number(projected[0].projectedUnits || 0)) / maxValue}
            r="4.5"
            fill="#F59E0B"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ) : null}

        {projected.length > 0 ? (
          <text x={splitX + 8} y={padding + 12} fill="#64748B" fontSize="11">Inicio de proyección</text>
        ) : null}

        {xTicks.map((tick) => {
          const x = padding + ((width - padding * 2) * tick.index) / Math.max(totalLength - 1, 1);
          return (
            <g key={`${tick.index}-${tick.label}`}>
              <line
                x1={x}
                y1={height - padding}
                x2={x}
                y2={height - padding + 5}
                stroke="#CBD5E1"
              />
              <text x={x} y={height - padding + 18} fill="#94A3B8" fontSize="10" textAnchor="middle">
                {tick.label}
              </text>
            </g>
          );
        })}

        <text x={width / 2 - 22} y={height - 2} fill="#94A3B8" fontSize="11">{xAxisLabel(chartGranularity)}</text>
        <text x={10} y={16} fill="#94A3B8" fontSize="11">Piezas</text>
      </svg>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="inline-flex items-center gap-2 text-[#1D6FD1]">
          <span className="h-3 w-3 rounded-full bg-[#1D6FD1]" />
          <span>Historico real {granularityLabel(chartGranularity)}</span>
        </div>
        <div className="inline-flex items-center gap-2 text-[#F59E0B]">
          <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
          <span>Proyección estimada {granularityLabel(chartGranularity)}</span>
        </div>
        <div className="inline-flex items-center gap-2 text-[#64748B]">
          <span className="h-3 w-3 rounded-full border-2 border-dashed border-[#CBD5E1]" />
          <span>A partir de aquí son periodos futuros</span>
        </div>
      </div>
    </div>
  );
}

export default function PronosticoComercialPage() {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [filters, setFilters] = useState({
    branchId: "",
    targetType: "product",
    productId: "",
    categoryId: "",
    lookbackDays: "30",
    horizonDays: "7",
  });

  const executeAnalysis = async (nextFilters) => {
    setLoading(true);
    try {
      const payload = {
        branchId: nextFilters.branchId,
        lookbackDays: nextFilters.lookbackDays,
        horizonDays: nextFilters.horizonDays,
        ...(nextFilters.targetType === "product"
          ? { productId: nextFilters.productId }
          : { categoryId: nextFilters.categoryId }),
      };
      const data = await getCommercialForecast(payload);
      setResult(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "No se pudo ejecutar el análisis predictivo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [branchItems, productItems, categoryItems] = await Promise.all([
          getBranches(),
          getProducts(),
          getCategories(),
        ]);
        setBranches(branchItems);
        setProducts(productItems);
        setCategories(categoryItems);

        const defaultBranch = branchItems.find((branch) => branch.name === DEFAULT_DEMO_CASE.branchName) || branchItems[0];
        const defaultProduct = productItems.find((product) => product.sku === DEFAULT_DEMO_CASE.productSku) || productItems[0];
        const nextFilters = {
          branchId: defaultBranch?.id || "",
          targetType: "product",
          productId: defaultProduct?.id || "",
          categoryId: categoryItems[0]?.id || "",
          lookbackDays: DEFAULT_DEMO_CASE.lookbackDays,
          horizonDays: DEFAULT_DEMO_CASE.horizonDays,
        };

        setFilters(nextFilters);
        setBootstrapped(true);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los filtros del pronóstico.");
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    if (!filters.branchId) return;
    if (filters.targetType === "product" && !filters.productId) return;
    if (filters.targetType === "category" && !filters.categoryId) return;

    const timeoutId = window.setTimeout(() => {
      executeAnalysis(filters);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [bootstrapped, filters]);

  const summaryItems = useMemo(() => {
    const metrics = result?.metrics || {
      averageDailyDemand: 0,
      projectedDemand: 0,
      stockCurrent: 0,
      coverageDays: null,
      suggestedRestock: 0,
    };

    return [
      {
        key: "avg",
        label: "Promedio de venta",
        value: renderUnitMetric(metrics.averageDailyDemand, "pzs/día"),
        description: "Promedio movil simple sobre el historico elegido",
        icon: TrendingUp,
        bgClassName: "bg-[#EEF5FF]",
        iconClassName: "text-[#1D6FD1]",
      },
      {
        key: "projected",
        label: "Demanda proyectada",
        value: renderUnitMetric(metrics.projectedDemand),
        description: `Pronóstico para ${result?.filters?.horizonLabel || "el horizonte seleccionado"}`,
        icon: LineChart,
        bgClassName: "bg-[#FFF8DB]",
        iconClassName: "text-[#8A5C00]",
      },
      {
        key: "stock",
        label: "Stock actual",
        value: renderUnitMetric(metrics.stockCurrent),
        description: "Existencia vigente en la sucursal",
        icon: Boxes,
        bgClassName: "bg-[#ECFDF5]",
        iconClassName: "text-[#047857]",
      },
      {
        key: "restock",
        label: "Reabasto sugerido",
        value: renderUnitMetric(metrics.suggestedRestock),
        description: renderDaysMetric(metrics.coverageDays),
        icon: Warehouse,
        bgClassName: "bg-[#FFF1F2]",
        iconClassName: "text-[#BE123C]",
      },
    ];
  }, [result]);

  return (
    <RoleLayout
      requiredRoles={["DUENO", "ADMIN"]}
      title="Pronóstico comercial"
      subtitle="Predicción de demanda y sugerencia de reabasto"
    >
      <section className="space-y-6">
        <CommercialHero
          title="Pronóstico comercial"
          description="Analiza ventas históricas por producto o categoría, proyecta demanda futura y simula escenarios de reabasto por sucursal."
          actions={
            <SecondaryButton type="button" onClick={() => executeAnalysis(filters)} disabled={loading}>
              <RefreshCcw size={16} />
              {loading ? "Actualizando..." : "Actualizar"}
            </SecondaryButton>
          }
        />

        <CommercialFilterCard
          subtitle="Configura la sucursal, el objetivo de análisis y el horizonte de proyección."
          actions={
            <PrimaryButton type="button" onClick={() => executeAnalysis(filters)} disabled={loading}>
              <Sparkles size={16} />
              {loading ? "Actualizando..." : "Actualizar análisis"}
            </PrimaryButton>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Sucursal</span>
              <select
                value={filters.branchId}
                onChange={(event) => setFilters((current) => ({ ...current, branchId: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Analizar por</span>
              <select
                value={filters.targetType}
                onChange={(event) => setFilters((current) => ({ ...current, targetType: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
              >
                <option value="product">Producto</option>
                <option value="category">Categoría</option>
              </select>
            </label>

            {filters.targetType === "product" ? (
              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-sm text-[#333]">Producto</span>
                <select
                  value={filters.productId}
                  onChange={(event) => setFilters((current) => ({ ...current, productId: event.target.value }))}
                  className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="flex flex-col gap-2 xl:col-span-2">
                <span className="text-sm text-[#333]">Categoría</span>
                <select
                  value={filters.categoryId}
                  onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}
                  className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Periodo histórico</span>
              <select
                value={filters.lookbackDays}
                onChange={(event) => setFilters((current) => ({ ...current, lookbackDays: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
              >
                {LOOKBACK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#333]">Horizonte</span>
              <select
                value={filters.horizonDays}
                onChange={(event) => setFilters((current) => ({ ...current, horizonDays: event.target.value }))}
                className="h-12 rounded-xl border-2 border-[#E0E0E0] bg-white px-3 text-[#1C1C1C] outline-none focus:border-[#4A90E2]"
              >
                {HORIZON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </CommercialFilterCard>

        {error ? (
          <div className="rounded-3xl border border-[#FECACA] bg-[#FFF1F2] px-5 py-4 text-sm text-[#BE123C]">
            {error}
          </div>
        ) : null}

        {result?.notices?.length ? (
          <div className="grid gap-3">
            {result.notices.map((notice) => (
              <div key={`${notice.kind}-${notice.title}`} className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] px-5 py-4">
                <p className="text-sm font-semibold text-[#1F2933]">{notice.title}</p>
                <p className="mt-1 text-sm text-[#4B5563]">{notice.message}</p>
              </div>
            ))}
          </div>
        ) : null}

        {!result ? (
          <CommercialPanel title="Pronóstico pendiente" subtitle="Ejecuta el análisis para visualizar histórico, proyección y simulación.">
            <CommercialEmptyState
              icon={PackageSearch}
              title="Sin resultados todavía"
              description="Selecciona una sucursal y un producto o categoría para generar el pronóstico comercial."
            />
          </CommercialPanel>
        ) : (
          <>
            <CommercialSummaryGrid items={summaryItems} />

            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <CommercialPanel
                title="Datos históricos"
                subtitle={`Historico ${granularityLabel(result.display.historyGranularity)} de ${result.target.name} en ${result.branch.name}.`}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-[#FFF9E6]">
                      <tr>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Periodo</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Unidades</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Total vendido</th>
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Transacciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.historicalData.map((item) => (
                        <tr key={item.periodLabel} className="border-t border-[#F1F5F9]">
                          <td className="px-5 py-4 text-sm text-[#374151]">{item.periodLabel}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#1F2933]">{renderTableUnit(item.unitsSold)}</td>
                          <td className="px-5 py-4 text-sm text-[#374151]">{formatCurrency(item.totalSold)}</td>
                          <td className="px-5 py-4 text-sm text-[#374151]">{item.transactions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CommercialPanel>

              <CommercialPanel title="Conclusión automática" subtitle="Interpretación breve para apoyar decisiones de reabasto.">
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-3xl border border-[#FFE9A8] bg-[#FFF8DB] p-5">
                    <p className="text-sm font-semibold text-[#1F2933]">{result.recommendation}</p>
                  </div>
                  <div className="rounded-3xl border border-[#E5E7EB] bg-[#FCFCFD] p-5 text-sm text-[#4B5563]">
                    <p>Sucursal: <span className="font-semibold text-[#1F2933]">{result.branch.name}</span></p>
                    <p className="mt-2">
                      Objetivo analizado: <span className="font-semibold text-[#1F2933]">{result.target.name}</span>
                    </p>
                    <p className="mt-2">
                      Horizonte de predicción: <span className="font-semibold text-[#1F2933]">{result.filters.horizonLabel}</span>
                    </p>
                  </div>
                </div>
              </CommercialPanel>
            </div>

            <CommercialPanel
              title="Visualización"
              subtitle="Compara el comportamiento pasado contra la predicción estimada del mismo objetivo de análisis."
            >
              <div className="grid gap-3 border-b border-[#F1F5F9] px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Objetivo</p>
                  <p className="mt-1 font-semibold text-[#1F2933]">{result.target.name}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Sucursal</p>
                  <p className="mt-1 font-semibold text-[#1F2933]">{result.branch.name}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Histórico usado</p>
                  <p className="mt-1 font-semibold text-[#1F2933]">Últimos {result.filters.lookbackDays} días</p>
                  <p className="mt-1 text-xs text-[#6B7280]">Lectura {granularityLabel(result.display.historyGranularity)}</p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">Horizonte</p>
                  <p className="mt-1 font-semibold text-[#1F2933]">Próximos {result.filters.horizonLabel}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">Proyección {granularityLabel(result.display.chartGranularity)}</p>
                </div>
              </div>
              <CompactLineChart
                historical={result.chart.historical}
                projected={result.chart.projected}
                chartGranularity={result.display.chartGranularity}
              />
            </CommercialPanel>

            <CommercialPanel title="Simulación de escenarios" subtitle="Comparativo mínimo para toma de decisiones de inventario.">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#FFF9E6]">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Escenario</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Demanda proyectada</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Stock considerado</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Cobertura</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Reabasto sugerido</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.simulations.map((scenario) => (
                      <tr key={scenario.key} className="border-t border-[#F1F5F9]">
                        <td className="px-5 py-4 font-semibold text-[#1F2933]">{scenario.label}</td>
                        <td className="px-5 py-4 text-sm text-[#374151]">{renderTableUnit(scenario.projectedDemand)}</td>
                        <td className="px-5 py-4 text-sm text-[#374151]">{renderTableUnit(scenario.stockConsidered)}</td>
                        <td className="px-5 py-4 text-sm text-[#374151]">{renderTableDays(scenario.coverageDays)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#1F2933]">{renderTableUnit(scenario.suggestedRestock)}</td>
                        <td className="px-5 py-4 text-sm text-[#374151]">{scenario.riskLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CommercialPanel>
          </>
        )}
      </section>
    </RoleLayout>
  );
}

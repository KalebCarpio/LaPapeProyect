import { prisma } from "../lib/prisma.js";

function startOfUtcDay(date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function addUtcDays(date, amount) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function dateKey(date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
}

function clampPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function isoWeekKey(date) {
  const current = startOfUtcDay(date);
  const dayNumber = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((current - yearStart) / 86400000) + 1) / 7);
  return `${current.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function monthKey(date) {
  return startOfUtcDay(date).toISOString().slice(0, 7);
}

function getHorizonMeta(horizonDays) {
  if (horizonDays >= 365) {
    return {
      label: "1 año",
      chartGranularity: "month",
      historyGranularity: "week",
      projectionBucketDays: 30,
      estimationLabel: "Estimación general de largo plazo",
      estimationNote: "Para horizontes de un año, la proyección se resume por mes y debe interpretarse como una guía general.",
    };
  }

  if (horizonDays >= 180) {
    return {
      label: "6 meses",
      chartGranularity: "month",
      historyGranularity: "week",
      projectionBucketDays: 30,
      estimationLabel: "Estimación general de mediano plazo",
      estimationNote: "Para seis meses, la visualización agrupa el comportamiento en bloques mensuales para mantener legibilidad.",
    };
  }

  if (horizonDays >= 90) {
    return {
      label: "3 meses",
      chartGranularity: "week",
      historyGranularity: "week",
      projectionBucketDays: 7,
      estimationLabel: "Estimación general",
      estimationNote: "Para tres meses, la proyección se muestra por semana para evitar una lectura demasiado rígida día por día.",
    };
  }

  return {
    label: `${horizonDays} dias`,
    chartGranularity: "day",
    historyGranularity: "day",
    projectionBucketDays: 1,
    estimationLabel: null,
    estimationNote: null,
  };
}

function createBucket(label) {
  return {
    label,
    unitsSold: 0,
    totalSold: 0,
    transactions: 0,
    days: 0,
  };
}

function aggregateHistory(historyTable, granularity) {
  if (granularity === "day") {
    return historyTable.map((item) => ({
      periodLabel: item.date,
      unitsSold: item.unitsSold,
      totalSold: item.totalSold,
      transactions: item.transactions,
      days: 1,
    }));
  }

  const buckets = new Map();

  for (const item of historyTable) {
    const sourceDate = new Date(`${item.date}T00:00:00.000Z`);
    const key = granularity === "month" ? monthKey(sourceDate) : isoWeekKey(sourceDate);

    if (!buckets.has(key)) {
      buckets.set(key, createBucket(key));
    }

    const bucket = buckets.get(key);
    bucket.unitsSold += Number(item.unitsSold || 0);
    bucket.totalSold += Number(item.totalSold || 0);
    bucket.transactions += Number(item.transactions || 0);
    bucket.days += 1;
  }

  return Array.from(buckets.values()).map((bucket) => ({
    periodLabel: bucket.label,
    unitsSold: round(bucket.unitsSold, 2),
    totalSold: round(bucket.totalSold, 2),
    transactions: bucket.transactions,
    days: bucket.days,
  }));
}

function buildProjectionSeries({ today, horizonDays, averageDailyDemand, granularity, projectionBucketDays }) {
  if (granularity === "day") {
    return Array.from({ length: horizonDays }, (_, index) => ({
      periodLabel: dateKey(addUtcDays(today, index + 1)),
      projectedUnits: round(averageDailyDemand, 2),
      bucketDays: 1,
    }));
  }

  const projection = [];
  let cursor = 0;

  while (cursor < horizonDays) {
    const bucketDays = Math.min(projectionBucketDays, horizonDays - cursor);
    const startDate = addUtcDays(today, cursor + 1);
    const label = granularity === "month" ? monthKey(startDate) : isoWeekKey(startDate);

    projection.push({
      periodLabel: label,
      projectedUnits: round(averageDailyDemand * bucketDays, 2),
      bucketDays,
    });

    cursor += bucketDays;
  }

  return projection;
}

function buildScenario({ key, label, multiplier, stock, averageDailyDemand, horizonDays }) {
  const projectedDemand = round(averageDailyDemand * horizonDays * multiplier);
  const coverageDays = averageDailyDemand > 0 ? round(stock / (averageDailyDemand * multiplier), 1) : null;
  const suggestedRestock = Math.max(0, Math.ceil(projectedDemand - stock));

  return {
    key,
    label,
    multiplier,
    projectedDemand,
    stockConsidered: stock,
    coverageDays,
    suggestedRestock,
    riskLevel:
      projectedDemand > stock
        ? "ALTO"
        : projectedDemand > stock * 0.8
          ? "MEDIO"
          : "BAJO",
  };
}

function buildRecommendation({ targetLabel, projectedDemand, stockCurrent, coverageDays, suggestedRestock }) {
  if (projectedDemand <= 0) {
    return `No hay demanda suficiente para proyectar reabasto inmediato de ${targetLabel}.`;
  }

  if (stockCurrent <= 0) {
    return `Existe desabasto actual. Se recomienda reabastecer al menos ${suggestedRestock} unidades para ${targetLabel}.`;
  }

  if (suggestedRestock > 0) {
    return `Se recomienda reabastecer ${suggestedRestock} unidades de ${targetLabel}. La cobertura estimada es de ${coverageDays ?? 0} dias.`;
  }

  return `La cobertura actual de ${targetLabel} es suficiente para el horizonte seleccionado.`;
}

export async function getCommercialForecastPrisma({
  branchId,
  productId,
  categoryId,
  lookbackDays = 30,
  horizonDays = 7,
}) {
  if (!branchId) {
    throw new Error("Selecciona una sucursal para ejecutar el pronóstico.");
  }

  if (!productId && !categoryId) {
    throw new Error("Selecciona un producto o una categoría para el análisis.");
  }

  const normalizedLookbackDays = clampPositiveInteger(lookbackDays, 30);
  const normalizedHorizonDays = clampPositiveInteger(horizonDays, 7);
  const today = startOfUtcDay(new Date());
  const historyStart = addUtcDays(today, -(normalizedLookbackDays - 1));
  const horizonMeta = getHorizonMeta(normalizedHorizonDays);

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true, name: true, direccion: true },
  });

  if (!branch) {
    throw new Error("La sucursal seleccionada no existe.");
  }

  let target = null;
  let productIds = [];
  let stockCurrent = 0;

  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        categoryId: true,
        categoryRelation: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) {
      throw new Error("El producto seleccionado no existe.");
    }

    const branchStock = await prisma.branchStock.findUnique({
      where: {
        branchId_productId: {
          branchId,
          productId,
        },
      },
      select: { stock: true },
    });

    productIds = [product.id];
    stockCurrent = branchStock?.stock || 0;
    target = {
      type: "product",
      id: product.id,
      name: product.name,
      sku: product.sku || "",
      categoryId: product.categoryId,
      categoryName: product.categoryRelation?.name || "",
    };
  } else {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        description: true,
        products: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error("La categoría seleccionada no existe.");
    }

    productIds = category.products.map((product) => product.id);
    const branchStocks = await prisma.branchStock.findMany({
      where: {
        branchId,
        productId: { in: productIds.length > 0 ? productIds : ["00000000-0000-0000-0000-000000000000"] },
      },
      select: { stock: true },
    });

    stockCurrent = branchStocks.reduce((sum, item) => sum + item.stock, 0);
    target = {
      type: "category",
      id: category.id,
      name: category.name,
      description: category.description || "",
      productCount: productIds.length,
    };
  }

  const details = await prisma.saleDetail.findMany({
    where: {
      productId: { in: productIds.length > 0 ? productIds : ["00000000-0000-0000-0000-000000000000"] },
      sale: {
        branchId,
        status: {
          not: "CANCELADA",
        },
        createdAt: {
          gte: historyStart,
          lte: addUtcDays(today, 1),
        },
      },
    },
    include: {
      sale: {
        select: {
          id: true,
          folio: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      sale: {
        createdAt: "asc",
      },
    },
  });

  const dailyMap = new Map();
  const historyTable = [];

  for (let offset = 0; offset < normalizedLookbackDays; offset += 1) {
    const currentDate = addUtcDays(historyStart, offset);
    const key = dateKey(currentDate);
    dailyMap.set(key, {
      date: key,
      unitsSold: 0,
      totalSold: 0,
      transactions: 0,
    });
  }

  const transactionSetByDay = new Map();

  for (const detail of details) {
    const key = dateKey(detail.sale.createdAt);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;

    const netUnits = Math.max(0, detail.cantidad - detail.returnedQuantity);
    const netRevenue =
      detail.cantidad > 0 ? (Number(detail.lineTotal || 0) / detail.cantidad) * netUnits : 0;

    bucket.unitsSold += netUnits;
    bucket.totalSold += netRevenue;

    const seen = transactionSetByDay.get(key) || new Set();
    if (!seen.has(detail.saleId)) {
      seen.add(detail.saleId);
      bucket.transactions += 1;
      transactionSetByDay.set(key, seen);
    }
  }

  for (const entry of dailyMap.values()) {
    historyTable.push({
      date: entry.date,
      unitsSold: round(entry.unitsSold, 2),
      totalSold: round(entry.totalSold, 2),
      transactions: entry.transactions,
    });
  }

  const averageDailyDemand = historyTable.length > 0
    ? round(historyTable.reduce((sum, item) => sum + item.unitsSold, 0) / historyTable.length, 2)
    : 0;
  const projectedDemand = round(averageDailyDemand * normalizedHorizonDays, 2);
  const coverageDays = averageDailyDemand > 0 ? round(stockCurrent / averageDailyDemand, 1) : null;
  const suggestedRestock = Math.max(0, Math.ceil(projectedDemand - stockCurrent));

  const projectionSeries = buildProjectionSeries({
    today,
    horizonDays: normalizedHorizonDays,
    averageDailyDemand,
    granularity: horizonMeta.chartGranularity,
    projectionBucketDays: horizonMeta.projectionBucketDays,
  });

  const aggregatedHistory = aggregateHistory(historyTable, horizonMeta.historyGranularity);

  const simulations = [
    buildScenario({
      key: "normal",
      label: "Escenario normal",
      multiplier: 1,
      stock: stockCurrent,
      averageDailyDemand,
      horizonDays: normalizedHorizonDays,
    }),
    buildScenario({
      key: "increase_10",
      label: "Incremento de demanda +10%",
      multiplier: 1.1,
      stock: stockCurrent,
      averageDailyDemand,
      horizonDays: normalizedHorizonDays,
    }),
    buildScenario({
      key: "low_stock",
      label: "Escenario de bajo stock",
      multiplier: 1,
      stock: Math.max(0, Math.floor(stockCurrent * 0.5)),
      averageDailyDemand,
      horizonDays: normalizedHorizonDays,
    }),
  ];

  const notices = [];

  if (horizonMeta.estimationNote) {
    notices.push({
      kind: "estimation",
      title: horizonMeta.estimationLabel,
      message: horizonMeta.estimationNote,
    });
  }

  if (normalizedHorizonDays >= 90 && normalizedLookbackDays < 60) {
    notices.push({
      kind: "history",
      title: "Histórico corto para horizonte amplio",
      message: "Considera usar 60 o 90 días de histórico para mejorar la lectura de horizontes medianos o largos.",
    });
  }

  return {
    branch,
    target,
    filters: {
      branchId,
      productId: productId || null,
      categoryId: categoryId || null,
      lookbackDays: normalizedLookbackDays,
      horizonDays: normalizedHorizonDays,
      horizonLabel: horizonMeta.label,
    },
    display: {
      historyGranularity: horizonMeta.historyGranularity,
      chartGranularity: horizonMeta.chartGranularity,
    },
    historicalData: aggregatedHistory,
    chart: {
      historical: aggregatedHistory.map((item) => ({
        periodLabel: item.periodLabel,
        units: item.unitsSold,
      })),
      projected: projectionSeries,
    },
    metrics: {
      averageDailyDemand,
      projectedDemand,
      stockCurrent,
      coverageDays,
      suggestedRestock,
    },
    simulations,
    notices,
    recommendation: buildRecommendation({
      targetLabel: target.name,
      projectedDemand,
      stockCurrent,
      coverageDays,
      suggestedRestock,
    }),
  };
}

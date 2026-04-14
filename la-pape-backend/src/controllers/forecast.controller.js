import { getCommercialForecastPrisma } from "../services/forecast.service.js";

export const getCommercialForecast = async (req, res) => {
  try {
    const result = await getCommercialForecastPrisma({
      branchId: String(req.query.branchId || "").trim(),
      productId: String(req.query.productId || "").trim() || null,
      categoryId: String(req.query.categoryId || "").trim() || null,
      lookbackDays: req.query.lookbackDays,
      horizonDays: req.query.horizonDays,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo ejecutar el pronóstico comercial" });
  }
};

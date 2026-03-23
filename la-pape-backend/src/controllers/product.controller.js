// src/controllers/product.controller.js
import {
  createProductPrisma,
  deleteProductPrisma,
  exportProductsCsvPrisma,
  getProductPrisma,
  getOfficialProductTemplateCsv,
  importProductsCsvPrisma,
  listProductsPrisma,
  toggleProductStatusPrisma,
  updateProductPrisma,
} from "../services/product.service.js";

export const listProducts = async (req, res) => {
  try {
    const items = await listProductsPrisma();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudo listar productos" });
  }
};

export const getProduct = async (req, res) => {
  try {
    const item = await getProductPrisma(req.params.id);
    if (!item) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudo obtener el producto" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const created = await createProductPrisma(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo crear el producto" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const existing = await getProductPrisma(req.params.id);
    if (!existing) return res.status(404).json({ message: "Producto no encontrado" });

    const item = await updateProductPrisma(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo actualizar el producto" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const existing = await getProductPrisma(req.params.id);
    if (!existing) return res.status(404).json({ message: "Producto no encontrado" });

    await deleteProductPrisma(req.params.id);
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo eliminar el producto" });
  }
};

export const toggleProductStatus = async (req, res) => {
  try {
    const existing = await getProductPrisma(req.params.id);
    if (!existing) return res.status(404).json({ message: "Producto no encontrado" });

    const item = await toggleProductStatusPrisma(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo cambiar el estado del producto" });
  }
};

export const importProductsCsv = async (req, res) => {
  try {
    const csvContent = String(req.body?.content || "");
    if (!csvContent.trim()) {
      return res.status(400).json({ message: "No se recibió contenido CSV para importar" });
    }

    const summary = await importProductsCsvPrisma(csvContent);
    res.json({ ok: true, summary });
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo importar el archivo CSV" });
  }
};

export const exportProductsCsv = async (req, res) => {
  try {
    const columns = String(req.query.columns || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const csv = await exportProductsCsvPrisma(columns);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="lapape_productos_exportados.csv"');
    res.send(csv);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo exportar el CSV" });
  }
};

export const downloadProductTemplate = (_req, res) => {
  const csv = getOfficialProductTemplateCsv();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="lapape_plantilla_productos.csv"');
  res.send(csv);
};

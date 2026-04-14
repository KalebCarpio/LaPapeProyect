import {
  createCategoryPrisma,
  getCategoryPrisma,
  listCategoriesPrisma,
  toggleCategoryStatusPrisma,
  updateCategoryPrisma,
} from "../services/category.service.js";

export const listCategories = async (req, res) => {
  try {
    const activeOnly = String(req.query.active || "").toLowerCase() === "true";
    const items = await listCategoriesPrisma({ activeOnly });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudieron listar las categorias" });
  }
};

export const getCategory = async (req, res) => {
  try {
    const item = await getCategoryPrisma(req.params.id);
    if (!item) return res.status(404).json({ message: "Categoria no encontrada" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudo obtener la categoria" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const created = await createCategoryPrisma(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo crear la categoria" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const existing = await getCategoryPrisma(req.params.id);
    if (!existing) return res.status(404).json({ message: "Categoria no encontrada" });

    const item = await updateCategoryPrisma(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo actualizar la categoria" });
  }
};

export const toggleCategoryStatus = async (req, res) => {
  try {
    const existing = await getCategoryPrisma(req.params.id);
    if (!existing) return res.status(404).json({ message: "Categoria no encontrada" });

    const item = await toggleCategoryStatusPrisma(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo cambiar el estado de la categoria" });
  }
};

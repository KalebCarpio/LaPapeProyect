// src/controllers/product.controller.js
import Product from "../models/Product.js";
export const listProducts = async (req, res) => {
  const where = {};
  // público puede ver solo activos si quieres:
  // where.isActive = true;

  const items = await Product.findAll({ where, order: [["createdAt", "DESC"]] });
  res.json(items);
};

export const getProduct = async (req, res) => {
  const item = await Product.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: "Producto no encontrado" });
  res.json(item);
};

export const createProduct = async (req, res) => {
  const created = await Product.create(req.body);
  res.status(201).json(created);
};

export const updateProduct = async (req, res) => {
  const item = await Product.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: "Producto no encontrado" });

  await item.update(req.body);
  res.json(item);
};

export const deleteProduct = async (req, res) => {
  const item = await Product.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: "Producto no encontrado" });

  await item.destroy();
  res.json({ message: "Producto eliminado" });
};
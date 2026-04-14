import { listBranchesPrisma } from "../services/branch.service.js";

export const listBranches = async (_req, res) => {
  try {
    const items = await listBranchesPrisma();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudieron listar las sucursales" });
  }
};

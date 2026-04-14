import {
  createSalePrisma,
  listBranchProductsPrisma,
  reprintSaleTicketPrisma,
} from "../services/sale.service.js";

export const listPosProducts = async (req, res) => {
  try {
    const branchId = String(req.query.branchId || "").trim();
    if (!branchId) {
      return res.status(400).json({ message: "branchId es obligatorio" });
    }

    const items = await listBranchProductsPrisma(branchId);
    res.json(items);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudieron listar los productos para POS" });
  }
};

export const createPosSale = async (req, res) => {
  try {
    const item = await createSalePrisma({
      payload: req.body,
      actorUserId: req.user.id,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo registrar la venta POS" });
  }
};

export const reprintPosTicket = async (req, res) => {
  try {
    const item = await reprintSaleTicketPrisma({
      saleId: req.params.id,
      actorUserId: req.user.id,
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo reimprimir el ticket POS" });
  }
};

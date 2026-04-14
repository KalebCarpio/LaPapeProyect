import {
  cancelSalePrisma,
  createSalePrisma,
  getSalePrisma,
  getSalesReportPrisma,
  listBranchProductsPrisma,
  listCommercialEventsPrisma,
  listSalesPrisma,
  refundSalePrisma,
  reprintSaleTicketPrisma,
} from "../services/sale.service.js";

export const listBranchProducts = async (req, res) => {
  try {
    const branchId = String(req.query.branchId || "").trim();
    if (!branchId) {
      return res.status(400).json({ message: "branchId es obligatorio" });
    }

    const items = await listBranchProductsPrisma(branchId);
    res.json(items);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudieron listar los productos por sucursal" });
  }
};

export const listSales = async (req, res) => {
  try {
    const items = await listSalesPrisma({
      folio: req.query.folio,
      branchId: req.query.branchId,
      userId: req.query.userId,
      status: req.query.status,
      paymentMethod: req.query.paymentMethod,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudieron listar las ventas" });
  }
};

export const getSale = async (req, res) => {
  try {
    const item = await getSalePrisma(req.params.id);
    if (!item) return res.status(404).json({ message: "Venta no encontrada" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudo obtener la venta" });
  }
};

export const createSale = async (req, res) => {
  try {
    const item = await createSalePrisma({
      payload: req.body,
      actorUserId: req.user.id,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo registrar la venta" });
  }
};

export const reprintSaleTicket = async (req, res) => {
  try {
    const item = await reprintSaleTicketPrisma({
      saleId: req.params.id,
      actorUserId: req.user.id,
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo reimprimir el ticket" });
  }
};

export const cancelSale = async (req, res) => {
  try {
    const item = await cancelSalePrisma({
      saleId: req.params.id,
      actorUserId: req.user.id,
      reason: req.body?.reason,
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo cancelar la venta" });
  }
};

export const refundSale = async (req, res) => {
  try {
    const item = await refundSalePrisma({
      saleId: req.params.id,
      actorUserId: req.user.id,
      reason: req.body?.reason,
      notes: req.body?.notes,
      items: req.body?.items,
    });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message || "No se pudo registrar la devolucion" });
  }
};

export const getSalesReport = async (req, res) => {
  try {
    const report = await getSalesReportPrisma({
      branchId: req.query.branchId,
      userId: req.query.userId,
      status: req.query.status,
      paymentMethod: req.query.paymentMethod,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudo generar el reporte de ventas" });
  }
};

export const listCommercialEvents = async (req, res) => {
  try {
    const items = await listCommercialEventsPrisma({
      branchId: req.query.branchId,
      userId: req.query.userId,
      type: req.query.type,
      folio: req.query.folio,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || "No se pudo listar la bitacora comercial" });
  }
};

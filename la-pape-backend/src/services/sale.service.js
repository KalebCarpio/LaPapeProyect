import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createCommercialEventPrisma } from "./commercial-event.service.js";

const saleInclude = {
  user: {
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      direccion: true,
    },
  },
  saleDetails: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          imageUrl: true,
          categoryLabel: true,
        },
      },
      offer: {
        select: {
          id: true,
          name: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  returns: {
    include: {
      processedBy: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
      items: {
        include: {
          saleDetail: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  commercialEvents: {
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
};

function formatCurrencyNumber(value) {
  return Number(value || 0);
}

function serializeSale(sale) {
  if (!sale) return null;

  return {
    id: sale.id,
    folio: sale.folio,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    subtotal: formatCurrencyNumber(sale.subtotal),
    discount: formatCurrencyNumber(sale.discount),
    total: formatCurrencyNumber(sale.total),
    notes: sale.notes || "",
    reprintCount: sale.reprintCount,
    cancelReason: sale.cancelReason || "",
    cancelledAt: sale.cancelledAt,
    returnedAt: sale.returnedAt,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    branch: sale.branch
      ? {
          id: sale.branch.id,
          name: sale.branch.name,
          direccion: sale.branch.direccion,
        }
      : null,
    user: sale.user
      ? {
          id: sale.user.id,
          nombre: sale.user.nombre,
          email: sale.user.email,
          rol: sale.user.rol,
        }
      : null,
    saleDetails: Array.isArray(sale.saleDetails)
      ? sale.saleDetails.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || "",
          productSku: item.product?.sku || "",
          imageUrl: item.product?.imageUrl || "",
          category: item.product?.categoryLabel || "",
          quantity: item.cantidad,
          returnedQuantity: item.returnedQuantity,
          price: formatCurrencyNumber(item.precio),
          unitDiscount: formatCurrencyNumber(item.unitDiscount),
          lineSubtotal: formatCurrencyNumber(item.lineSubtotal),
          lineDiscount: formatCurrencyNumber(item.lineDiscount),
          lineTotal: formatCurrencyNumber(item.lineTotal),
          offer: item.offer
            ? {
                id: item.offer.id,
                name: item.offer.name,
                discountType: item.offer.discountType,
                discountValue: formatCurrencyNumber(item.offer.discountValue),
              }
            : null,
        }))
      : [],
    returns: Array.isArray(sale.returns)
      ? sale.returns.map((refund) => ({
          id: refund.id,
          reason: refund.reason,
          notes: refund.notes || "",
          totalAmount: formatCurrencyNumber(refund.totalAmount),
          isFullReturn: refund.isFullReturn,
          createdAt: refund.createdAt,
          processedBy: refund.processedBy
            ? {
                id: refund.processedBy.id,
                nombre: refund.processedBy.nombre,
                email: refund.processedBy.email,
              }
            : null,
          items: refund.items.map((item) => ({
            id: item.id,
            saleDetailId: item.saleDetailId,
            quantity: item.quantity,
            amount: formatCurrencyNumber(item.amount),
            productName: item.saleDetail?.product?.name || "",
            productSku: item.saleDetail?.product?.sku || "",
          })),
        }))
      : [],
    commercialEvents: Array.isArray(sale.commercialEvents)
      ? sale.commercialEvents.map((event) => ({
          id: event.id,
          type: event.type,
          action: event.action,
          folio: event.folio,
          description: event.description,
          reason: event.reason || "",
          metadata: event.metadata || {},
          createdAt: event.createdAt,
          user: event.user
            ? {
                id: event.user.id,
                nombre: event.user.nombre,
                email: event.user.email,
              }
            : null,
          branch: event.branch
            ? {
                id: event.branch.id,
                name: event.branch.name,
              }
            : null,
        }))
      : [],
  };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function dateStart(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateEnd(value) {
  return new Date(`${value}T23:59:59.999Z`);
}

async function generateSaleFolio(tx, branchId) {
  const branch = await tx.branch.findUnique({
    where: { id: branchId },
    select: { name: true },
  });

  const branchCode = normalizeText(branch?.name || "GEN")
    .replace(/[^a-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4) || "GEN";
  const date = new Date();
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
  const sequence = await tx.sale.count({
    where: {
      branchId,
      createdAt: {
        gte: dateStart(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`),
        lte: dateEnd(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`),
      },
    },
  });

  return `VT-${branchCode}-${stamp}-${String(sequence + 1).padStart(4, "0")}`;
}

function mapBranchProduct(item) {
  const product = item.product;
  return {
    id: product.id,
    branchStockId: item.id,
    branchId: item.branchId,
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: product.categoryRelation?.name || product.categoryLabel || "",
    categoryId: product.categoryId,
    brand: product.brandRelation?.name || product.brandLabel || "",
    price: formatCurrencyNumber(product.price),
    stock: item.stock,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
  };
}

export async function listBranchProductsPrisma(branchId) {
  const items = await prisma.branchStock.findMany({
    where: {
      branchId,
      product: {
        isActive: true,
      },
    },
    include: {
      product: {
        include: {
          categoryRelation: true,
          brandRelation: true,
        },
      },
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });

  return items.map(mapBranchProduct);
}

async function getApplicableOffers(tx, productsById) {
  const now = new Date();
  const productIds = Object.keys(productsById);
  const categoryIds = Array.from(
    new Set(productIds.map((productId) => productsById[productId].categoryId).filter(Boolean))
  );

  if (productIds.length === 0) return [];

  return tx.offer.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [
        {
          appliesTo: "PRODUCT",
          productId: { in: productIds },
        },
        {
          appliesTo: "CATEGORY",
          categoryId: { in: categoryIds.length > 0 ? categoryIds : ["00000000-0000-0000-0000-000000000000"] },
        },
      ],
    },
  });
}

function resolveBestOffer(offers, product, unitPrice) {
  const applicable = offers.filter((offer) => {
    if (offer.appliesTo === "PRODUCT") return offer.productId === product.id;
    return Boolean(product.categoryId) && offer.categoryId === product.categoryId;
  });

  if (applicable.length === 0) return { offer: null, unitDiscount: 0 };

  const ranked = applicable
    .map((offer) => {
      const unitDiscount = offer.discountType === "PERCENTAGE"
        ? (unitPrice * formatCurrencyNumber(offer.discountValue)) / 100
        : Math.min(unitPrice, formatCurrencyNumber(offer.discountValue));

      return { offer, unitDiscount };
    })
    .sort((left, right) => right.unitDiscount - left.unitDiscount);

  return ranked[0];
}

function assertSalePayload(payload) {
  if (!payload.branchId) throw new Error("Selecciona una sucursal para la venta.");
  if (!payload.paymentMethod) throw new Error("Selecciona un metodo de pago.");
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Agrega al menos un producto al carrito.");
  }
  if (payload.manualDiscount !== undefined) {
    const amount = Number(payload.manualDiscount || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("El descuento manual debe ser numerico y mayor o igual a 0.");
    }
  }
}

export async function createSalePrisma({ payload, actorUserId }) {
  assertSalePayload(payload);

  return prisma.$transaction(async (tx) => {
    const uniqueProductIds = Array.from(new Set(payload.items.map((item) => item.productId)));
    const branchStocks = await tx.branchStock.findMany({
      where: {
        branchId: payload.branchId,
        productId: { in: uniqueProductIds },
      },
      include: {
        product: true,
      },
    });

    const branchStockMap = new Map(branchStocks.map((item) => [item.productId, item]));
    const productsById = Object.fromEntries(branchStocks.map((item) => [item.productId, item.product]));
    const offers = await getApplicableOffers(tx, productsById);

    let subtotal = 0;
    let discount = 0;
    const saleLines = [];

    for (const item of payload.items) {
      const quantity = Number(item.quantity || 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Todas las cantidades del carrito deben ser mayores a 0.");
      }

      const branchStock = branchStockMap.get(item.productId);
      if (!branchStock) {
        throw new Error("Uno de los productos no existe en la sucursal seleccionada.");
      }

      if (branchStock.stock < quantity) {
        throw new Error(`Stock insuficiente para ${branchStock.product.name}. Disponible: ${branchStock.stock}.`);
      }

      const unitPrice = formatCurrencyNumber(branchStock.product.price);
      const { offer, unitDiscount } = resolveBestOffer(offers, branchStock.product, unitPrice);
      const lineSubtotal = unitPrice * quantity;
      const lineDiscount = unitDiscount * quantity;
      const lineTotal = lineSubtotal - lineDiscount;

      subtotal += lineSubtotal;
      discount += lineDiscount;

      saleLines.push({
        branchStock,
        quantity,
        unitPrice,
        offer,
        unitDiscount,
        lineSubtotal,
        lineDiscount,
        lineTotal,
      });
    }

    const folio = await generateSaleFolio(tx, payload.branchId);
    const manualDiscount = Math.min(Number(payload.manualDiscount || 0), subtotal - discount);
    const totalDiscount = discount + manualDiscount;
    const total = subtotal - totalDiscount;

    const sale = await tx.sale.create({
      data: {
        folio,
        userId: actorUserId,
        branchId: payload.branchId,
        paymentMethod: payload.paymentMethod,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        discount: new Prisma.Decimal(totalDiscount.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        notes: payload.notes ? String(payload.notes).trim() : null,
        saleDetails: {
          create: saleLines.map((line) => ({
            productId: line.branchStock.productId,
            offerId: line.offer?.id || null,
            cantidad: line.quantity,
            precio: new Prisma.Decimal(line.unitPrice.toFixed(2)),
            unitDiscount: new Prisma.Decimal(line.unitDiscount.toFixed(2)),
            lineSubtotal: new Prisma.Decimal(line.lineSubtotal.toFixed(2)),
            lineDiscount: new Prisma.Decimal(line.lineDiscount.toFixed(2)),
            lineTotal: new Prisma.Decimal(line.lineTotal.toFixed(2)),
          })),
        },
      },
      include: saleInclude,
    });

    for (const line of saleLines) {
      await tx.branchStock.update({
        where: {
          branchId_productId: {
            branchId: payload.branchId,
            productId: line.branchStock.productId,
          },
        },
        data: {
          stock: { decrement: line.quantity },
        },
      });

      await tx.product.update({
        where: { id: line.branchStock.productId },
        data: {
          stock: { decrement: line.quantity },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: line.branchStock.productId,
          tipo: "SALIDA",
          cantidad: line.quantity,
          descripcion: `Venta ${folio} en sucursal ${payload.branchId}`,
        },
      });
    }

    await createCommercialEventPrisma(tx, {
      saleId: sale.id,
      branchId: payload.branchId,
      userId: actorUserId,
      type: "VENTA_CREADA",
      action: "SALE_CREATED",
      folio,
      description: `Venta ${folio} creada por ${sale.user?.nombre || "usuario"} por un total de ${total.toFixed(2)}.`,
      metadata: {
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(totalDiscount.toFixed(2)),
        offersDiscount: Number(discount.toFixed(2)),
        manualDiscount: Number(manualDiscount.toFixed(2)),
        total: Number(total.toFixed(2)),
        paymentMethod: payload.paymentMethod,
        itemCount: saleLines.length,
      },
    });

    for (const line of saleLines.filter((item) => item.offer)) {
      await createCommercialEventPrisma(tx, {
        saleId: sale.id,
        branchId: payload.branchId,
        userId: actorUserId,
        type: "DESCUENTO_APLICADO",
        action: "SALE_DISCOUNT_APPLIED",
        folio,
        description: `Se aplico la oferta ${line.offer.name} al producto ${line.branchStock.product.name}.`,
        metadata: {
          offerId: line.offer.id,
          offerName: line.offer.name,
          productId: line.branchStock.productId,
          quantity: line.quantity,
          lineDiscount: Number(line.lineDiscount.toFixed(2)),
        },
      });
    }

    if (manualDiscount > 0) {
      await createCommercialEventPrisma(tx, {
        saleId: sale.id,
        branchId: payload.branchId,
        userId: actorUserId,
        type: "DESCUENTO_APLICADO",
        action: "SALE_MANUAL_DISCOUNT_APPLIED",
        folio,
        description: `Se aplico un descuento manual a la venta ${folio}.`,
        metadata: {
          manualDiscount: Number(manualDiscount.toFixed(2)),
        },
      });
    }

    const refreshed = await tx.sale.findUnique({
      where: { id: sale.id },
      include: saleInclude,
    });

    return serializeSale(refreshed);
  });
}

export async function listSalesPrisma(filters = {}) {
  const where = {};

  if (filters.folio) {
    where.folio = {
      contains: String(filters.folio).trim(),
      mode: "insensitive",
    };
  }

  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.status) where.status = filters.status;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = dateStart(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = dateEnd(filters.dateTo);
  }

  const items = await prisma.sale.findMany({
    where,
    include: saleInclude,
    orderBy: { createdAt: "desc" },
  });

  return items.map(serializeSale);
}

export async function getSalePrisma(saleId) {
  const item = await prisma.sale.findUnique({
    where: { id: saleId },
    include: saleInclude,
  });

  return serializeSale(item);
}

export async function reprintSaleTicketPrisma({ saleId, actorUserId }) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.update({
      where: { id: saleId },
      data: {
        reprintCount: { increment: 1 },
      },
      include: saleInclude,
    });

    await createCommercialEventPrisma(tx, {
      saleId: sale.id,
      branchId: sale.branchId,
      userId: actorUserId,
      type: "TICKET_REIMPRESO",
      action: "SALE_TICKET_REPRINTED",
      folio: sale.folio,
      description: `Se reimprimio el ticket de la venta ${sale.folio}.`,
      metadata: {
        reprintCount: sale.reprintCount,
      },
    });

    return serializeSale(sale);
  });
}

export async function cancelSalePrisma({ saleId, actorUserId, reason }) {
  if (!String(reason || "").trim()) {
    throw new Error("El motivo de cancelacion es obligatorio.");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: saleInclude,
    });

    if (!sale) throw new Error("Venta no encontrada.");
    if (sale.status !== "COMPLETADA") {
      throw new Error("Solo se pueden cancelar ventas completadas sin devoluciones previas.");
    }

    for (const detail of sale.saleDetails) {
      await tx.branchStock.update({
        where: {
          branchId_productId: {
            branchId: sale.branchId,
            productId: detail.productId,
          },
        },
        data: {
          stock: { increment: detail.cantidad },
        },
      });

      await tx.product.update({
        where: { id: detail.productId },
        data: {
          stock: { increment: detail.cantidad },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: detail.productId,
          tipo: "ENTRADA",
          cantidad: detail.cantidad,
          descripcion: `Cancelacion de venta ${sale.folio}`,
        },
      });
    }

    const updated = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: "CANCELADA",
        cancelReason: String(reason).trim(),
        cancelledAt: new Date(),
        cancelledByUserId: actorUserId,
      },
      include: saleInclude,
    });

    await createCommercialEventPrisma(tx, {
      saleId: updated.id,
      branchId: updated.branchId,
      userId: actorUserId,
      type: "VENTA_CANCELADA",
      action: "SALE_CANCELLED",
      folio: updated.folio,
      description: `La venta ${updated.folio} fue cancelada.`,
      reason: String(reason).trim(),
      metadata: {
        total: formatCurrencyNumber(updated.total),
      },
    });

    return serializeSale(updated);
  });
}

export async function refundSalePrisma({ saleId, actorUserId, reason, notes, items }) {
  if (!String(reason || "").trim()) {
    throw new Error("El motivo de devolucion es obligatorio.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Selecciona al menos un producto para devolver.");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: saleInclude,
    });

    if (!sale) throw new Error("Venta no encontrada.");
    if (!["COMPLETADA", "PARCIALMENTE_DEVUELTA"].includes(sale.status)) {
      throw new Error("La venta no admite nuevas devoluciones.");
    }

    const detailMap = new Map(sale.saleDetails.map((detail) => [detail.id, detail]));
    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const detail = detailMap.get(item.saleDetailId);
      const quantity = Number(item.quantity || 0);

      if (!detail) {
        throw new Error("Uno de los conceptos a devolver no existe.");
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("La cantidad a devolver debe ser mayor a 0.");
      }

      const available = detail.cantidad - detail.returnedQuantity;
      if (quantity > available) {
        throw new Error(`No puedes devolver ${quantity} unidad(es) de ${detail.product?.name}. Disponible para devolver: ${available}.`);
      }

      const unitNet = formatCurrencyNumber(detail.lineTotal) / detail.cantidad;
      const amount = unitNet * quantity;
      totalAmount += amount;

      normalizedItems.push({
        detail,
        quantity,
        amount,
      });
    }

    const refund = await tx.saleReturn.create({
      data: {
        saleId: sale.id,
        branchId: sale.branchId,
        processedById: actorUserId,
        reason: String(reason).trim(),
        notes: notes ? String(notes).trim() : null,
        totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
        isFullReturn: false,
        items: {
          create: normalizedItems.map((item) => ({
            saleDetailId: item.detail.id,
            quantity: item.quantity,
            amount: new Prisma.Decimal(item.amount.toFixed(2)),
          })),
        },
      },
    });

    for (const item of normalizedItems) {
      await tx.saleDetail.update({
        where: { id: item.detail.id },
        data: {
          returnedQuantity: { increment: item.quantity },
        },
      });

      await tx.branchStock.update({
        where: {
          branchId_productId: {
            branchId: sale.branchId,
            productId: item.detail.productId,
          },
        },
        data: {
          stock: { increment: item.quantity },
        },
      });

      await tx.product.update({
        where: { id: item.detail.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.detail.productId,
          tipo: "ENTRADA",
          cantidad: item.quantity,
          descripcion: `Devolucion de venta ${sale.folio}`,
        },
      });
    }

    const refreshedDetails = await tx.saleDetail.findMany({
      where: { saleId: sale.id },
      select: {
        cantidad: true,
        returnedQuantity: true,
      },
    });

    const isFullReturn = refreshedDetails.every((item) => item.returnedQuantity >= item.cantidad);
    await tx.saleReturn.update({
      where: { id: refund.id },
      data: {
        isFullReturn,
      },
    });

    const updatedSale = await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: isFullReturn ? "DEVUELTA" : "PARCIALMENTE_DEVUELTA",
        returnedAt: isFullReturn ? new Date() : sale.returnedAt,
        lastRefundedById: actorUserId,
      },
      include: saleInclude,
    });

    await createCommercialEventPrisma(tx, {
      saleId: updatedSale.id,
      branchId: updatedSale.branchId,
      userId: actorUserId,
      type: isFullReturn ? "DEVOLUCION_TOTAL" : "DEVOLUCION_PARCIAL",
      action: isFullReturn ? "SALE_REFUNDED_FULL" : "SALE_REFUNDED_PARTIAL",
      folio: updatedSale.folio,
      description: isFullReturn
        ? `Se devolvio totalmente la venta ${updatedSale.folio}.`
        : `Se registro una devolucion parcial para la venta ${updatedSale.folio}.`,
      reason: String(reason).trim(),
      metadata: {
        totalAmount: Number(totalAmount.toFixed(2)),
        items: normalizedItems.map((item) => ({
          saleDetailId: item.detail.id,
          productId: item.detail.productId,
          quantity: item.quantity,
          amount: Number(item.amount.toFixed(2)),
        })),
      },
    });

    return serializeSale(updatedSale);
  });
}

export async function getSalesReportPrisma(filters = {}) {
  const sales = await listSalesPrisma(filters);
  const effectiveSales = sales.filter((sale) => sale.status !== "CANCELADA");
  const totalSold = effectiveSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalDiscount = effectiveSales.reduce((sum, sale) => sum + sale.discount, 0);
  const cancelledSales = sales.filter((sale) => sale.status === "CANCELADA");
  const returns = sales.flatMap((sale) => sale.returns || []);
  const totalRefunded = returns.reduce((sum, refund) => sum + refund.totalAmount, 0);
  const averageTicket = effectiveSales.length > 0 ? totalSold / effectiveSales.length : 0;

  const byBranchMap = new Map();
  const byUserMap = new Map();
  const productMap = new Map();
  let offersUsed = 0;

  for (const sale of effectiveSales) {
    const branchKey = sale.branch?.id || "sin-sucursal";
    const branchCurrent = byBranchMap.get(branchKey) || {
      branchId: sale.branch?.id || null,
      branchName: sale.branch?.name || "Sin sucursal",
      total: 0,
      count: 0,
    };
    branchCurrent.total += sale.total;
    branchCurrent.count += 1;
    byBranchMap.set(branchKey, branchCurrent);

    const userKey = sale.user?.id || "sin-usuario";
    const userCurrent = byUserMap.get(userKey) || {
      userId: sale.user?.id || null,
      userName: sale.user?.nombre || sale.user?.email || "Sin usuario",
      total: 0,
      count: 0,
    };
    userCurrent.total += sale.total;
    userCurrent.count += 1;
    byUserMap.set(userKey, userCurrent);

    for (const detail of sale.saleDetails) {
      const netQuantity = detail.quantity - detail.returnedQuantity;
      const currentProduct = productMap.get(detail.productId) || {
        productId: detail.productId,
        productName: detail.productName,
        quantity: 0,
        total: 0,
      };
      currentProduct.quantity += netQuantity;
      currentProduct.total += detail.lineTotal;
      productMap.set(detail.productId, currentProduct);

      if (detail.offer?.id) {
        offersUsed += 1;
      }
    }
  }

  return {
    summary: {
      totalSold: Number(totalSold.toFixed(2)),
      saleCount: sales.length,
      effectiveSaleCount: effectiveSales.length,
      averageTicket: Number(averageTicket.toFixed(2)),
      cancelledCount: cancelledSales.length,
      refundCount: returns.length,
      refundedAmount: Number(totalRefunded.toFixed(2)),
      discountAmount: Number(totalDiscount.toFixed(2)),
      offersUsed,
    },
    sales,
    byBranch: Array.from(byBranchMap.values()).sort((a, b) => b.total - a.total),
    byUser: Array.from(byUserMap.values()).sort((a, b) => b.total - a.total),
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
  };
}

export async function listCommercialEventsPrisma(filters = {}) {
  const where = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.type) where.type = filters.type;
  if (filters.folio) {
    where.folio = {
      contains: String(filters.folio).trim(),
      mode: "insensitive",
    };
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = dateStart(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = dateEnd(filters.dateTo);
  }

  const items = await prisma.commercialEvent.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      sale: {
        select: {
          id: true,
          folio: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((event) => ({
    id: event.id,
    type: event.type,
    action: event.action,
    folio: event.folio || event.sale?.folio || "",
    description: event.description,
    reason: event.reason || "",
    metadata: event.metadata || {},
    createdAt: event.createdAt,
    branch: event.branch ? { id: event.branch.id, name: event.branch.name } : null,
    user: event.user ? { id: event.user.id, nombre: event.user.nombre, email: event.user.email } : null,
    sale: event.sale ? { id: event.sale.id, folio: event.sale.folio, status: event.sale.status } : null,
  }));
}

export async function createCommercialEventPrisma(tx, payload) {
  const event = await tx.commercialEvent.create({
    data: {
      saleId: payload.saleId || null,
      branchId: payload.branchId || null,
      userId: payload.userId || null,
      type: payload.type,
      action: payload.action,
      folio: payload.folio || null,
      description: payload.description,
      reason: payload.reason || null,
      metadata: payload.metadata || {},
    },
  });

  await tx.systemAuditLog.create({
    data: {
      userId: payload.userId || null,
      accion: payload.action,
      descripcion: payload.description,
      fecha: new Date(),
    },
  });

  return event;
}

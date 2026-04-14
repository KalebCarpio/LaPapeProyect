import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const offerInclude = {
  product: {
    select: {
      id: true,
      name: true,
      categoryId: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
  },
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatDateOnly(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function serializeOffer(offer) {
  if (!offer) return null;

  const targetId = offer.appliesTo === "CATEGORY" ? offer.categoryId : offer.productId;
  const targetValue = offer.appliesTo === "CATEGORY" ? offer.category?.name : offer.product?.name;
  const relatedProductCount =
    offer.appliesTo === "CATEGORY"
      ? offer.category?._count?.products ?? 0
      : offer.product
        ? 1
        : 0;

  return {
    id: offer.id,
    name: offer.name,
    description: offer.description || "",
    discountType: offer.discountType === "PERCENTAGE" ? "percentage" : "fixed",
    discountValue: Number(offer.discountValue),
    appliesTo: offer.appliesTo === "CATEGORY" ? "category" : "product",
    targetId,
    targetValue: targetValue || "",
    startsAt: formatDateOnly(offer.startsAt),
    endsAt: formatDateOnly(offer.endsAt),
    isActive: offer.isActive,
    relatedProductCount,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  };
}

function assertValidOfferPayload(payload, { partial = false } = {}) {
  const name = String(payload.name ?? "").trim();
  const discountValue = Number(payload.discountValue ?? 0);
  const appliesTo = String(payload.appliesTo ?? "").trim().toLowerCase();
  const startsAt = String(payload.startsAt ?? "").trim();
  const endsAt = String(payload.endsAt ?? "").trim();

  if ((!partial || payload.name !== undefined) && !name) {
    throw new Error("El nombre de la oferta es obligatorio.");
  }

  if (payload.discountType !== undefined || !partial) {
    if (!["percentage", "fixed"].includes(String(payload.discountType || "").trim().toLowerCase())) {
      throw new Error("El tipo de descuento no es válido.");
    }
  }

  if ((payload.discountValue !== undefined || !partial) && (!Number.isFinite(discountValue) || discountValue <= 0)) {
    throw new Error("El valor del descuento debe ser mayor a 0.");
  }

  if (payload.appliesTo !== undefined || !partial) {
    if (!["product", "category"].includes(appliesTo)) {
      throw new Error("El alcance de la oferta no es válido.");
    }
  }

  if ((!partial || payload.startsAt !== undefined) && !startsAt) {
    throw new Error("La fecha de inicio es obligatoria.");
  }

  if ((!partial || payload.endsAt !== undefined) && !endsAt) {
    throw new Error("La fecha de fin es obligatoria.");
  }

  if ((payload.startsAt !== undefined || payload.endsAt !== undefined || !partial) && startsAt && endsAt && endsAt < startsAt) {
    throw new Error("La vigencia final debe ser posterior al inicio.");
  }
}

async function resolveOfferTarget(payload, currentOffer) {
  const appliesTo = String(payload.appliesTo ?? currentOffer?.appliesTo ?? "").trim().toLowerCase();
  const rawTargetId = payload.targetId ?? payload.productId ?? payload.categoryId ?? null;
  const rawTargetValue = payload.targetValue ?? null;

  if (!appliesTo) {
    throw new Error("Debes indicar si la oferta aplica a producto o categoria.");
  }

  if (appliesTo === "product") {
    let product = null;

    if (rawTargetId) {
      product = await prisma.product.findUnique({
        where: { id: String(rawTargetId) },
        select: { id: true, name: true },
      });
    } else if (rawTargetValue) {
      const products = await prisma.product.findMany({
        select: { id: true, name: true },
      });
      product = products.find((item) => normalizeText(item.name) === normalizeText(rawTargetValue)) || null;
    }

    if (!product) {
      throw new Error("Selecciona un producto válido para la oferta.");
    }

    return {
      appliesTo: "PRODUCT",
      productId: product.id,
      categoryId: null,
    };
  }

  let category = null;

  if (rawTargetId) {
    category = await prisma.category.findUnique({
      where: { id: String(rawTargetId) },
      select: { id: true, name: true },
    });
  } else if (rawTargetValue) {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    category = categories.find((item) => normalizeText(item.name) === normalizeText(rawTargetValue)) || null;
  }

  if (!category) {
    throw new Error("Selecciona una categoria válida para la oferta.");
  }

  return {
    appliesTo: "CATEGORY",
    productId: null,
    categoryId: category.id,
  };
}

function buildOfferData(payload) {
  const data = {};

  if (payload.name !== undefined) data.name = String(payload.name).trim();
  if (payload.description !== undefined) {
    data.description = payload.description ? String(payload.description).trim() : "";
  }
  if (payload.discountType !== undefined) {
    data.discountType = String(payload.discountType).trim().toLowerCase() === "percentage" ? "PERCENTAGE" : "FIXED";
  }
  if (payload.discountValue !== undefined) {
    data.discountValue = new Prisma.Decimal(payload.discountValue);
  }
  if (payload.startsAt !== undefined) data.startsAt = new Date(`${payload.startsAt}T00:00:00.000Z`);
  if (payload.endsAt !== undefined) data.endsAt = new Date(`${payload.endsAt}T00:00:00.000Z`);
  if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);

  return data;
}

export async function listOffersPrisma() {
  const items = await prisma.offer.findMany({
    include: offerInclude,
    orderBy: { updatedAt: "desc" },
  });

  return items.map(serializeOffer);
}

export async function getOfferPrisma(offerId) {
  const item = await prisma.offer.findUnique({
    where: { id: offerId },
    include: offerInclude,
  });

  return serializeOffer(item);
}

export async function createOfferPrisma(payload) {
  assertValidOfferPayload(payload);
  const target = await resolveOfferTarget(payload);

  const item = await prisma.offer.create({
    data: {
      ...buildOfferData(payload),
      ...target,
    },
    include: offerInclude,
  });

  return serializeOffer(item);
}

export async function updateOfferPrisma(offerId, payload) {
  assertValidOfferPayload(payload, { partial: true });

  const current = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      appliesTo: true,
      productId: true,
      categoryId: true,
    },
  });

  if (!current) {
    throw new Error("Oferta no encontrada.");
  }

  const shouldResolveTarget =
    payload.appliesTo !== undefined ||
    payload.targetId !== undefined ||
    payload.targetValue !== undefined ||
    payload.productId !== undefined ||
    payload.categoryId !== undefined;

  const item = await prisma.offer.update({
    where: { id: offerId },
    data: {
      ...buildOfferData(payload),
      ...(shouldResolveTarget ? await resolveOfferTarget(payload, current) : {}),
    },
    include: offerInclude,
  });

  return serializeOffer(item);
}

export async function toggleOfferStatusPrisma(offerId) {
  const current = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { isActive: true },
  });

  if (!current) {
    throw new Error("Oferta no encontrada.");
  }

  const item = await prisma.offer.update({
    where: { id: offerId },
    data: { isActive: !current.isActive },
    include: offerInclude,
  });

  return serializeOffer(item);
}

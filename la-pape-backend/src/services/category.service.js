import { prisma } from "../lib/prisma.js";

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function serializeCategory(category) {
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    description: category.description || "",
    isActive: category.isActive,
    productCount: category._count?.products ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function findCategoryByName(name, excludeId) {
  const normalized = normalizeText(name);
  if (!normalized) return null;

  const items = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  return items.find((item) => {
    if (excludeId && item.id === excludeId) return false;
    return normalizeText(item.name) === normalized;
  }) || null;
}

function assertValidCategoryPayload(payload, { partial = false } = {}) {
  const name = String(payload.name ?? "").trim();

  if ((!partial || payload.name !== undefined) && !name) {
    throw new Error("El nombre de la categoria es obligatorio.");
  }
}

export async function listCategoriesPrisma({ activeOnly = false } = {}) {
  const items = await prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return items.map(serializeCategory);
}

export async function getCategoryPrisma(categoryId) {
  const item = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return serializeCategory(item);
}

export async function createCategoryPrisma(payload) {
  assertValidCategoryPayload(payload);

  const name = String(payload.name).trim();
  const duplicate = await findCategoryByName(name);
  if (duplicate) {
    throw new Error("Ya existe una categoria con ese nombre.");
  }

  const item = await prisma.category.create({
    data: {
      name,
      description: payload.description ? String(payload.description).trim() : "",
      isActive: payload.isActive !== false,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return serializeCategory(item);
}

export async function updateCategoryPrisma(categoryId, payload) {
  assertValidCategoryPayload(payload, { partial: true });

  const current = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!current) {
    throw new Error("Categoria no encontrada.");
  }

  const nextName = payload.name !== undefined ? String(payload.name).trim() : current.name;
  const duplicate = await findCategoryByName(nextName, categoryId);
  if (duplicate) {
    throw new Error("Ya existe otra categoria con ese nombre.");
  }

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id: categoryId },
      data: {
        ...(payload.name !== undefined ? { name: nextName } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description ? String(payload.description).trim() : "" }
          : {}),
        ...(payload.isActive !== undefined ? { isActive: Boolean(payload.isActive) } : {}),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (payload.name !== undefined && nextName !== current.name) {
      await tx.product.updateMany({
        where: { categoryId },
        data: { categoryLabel: nextName },
      });
    }

    return updated;
  });

  return serializeCategory(item);
}

export async function toggleCategoryStatusPrisma(categoryId) {
  const current = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { isActive: true },
  });

  if (!current) {
    throw new Error("Categoria no encontrada.");
  }

  const item = await prisma.category.update({
    where: { id: categoryId },
    data: { isActive: !current.isActive },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return serializeCategory(item);
}

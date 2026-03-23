import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const CSV_HEADERS = [
  "nombre",
  "codigo_producto",
  "descripcion",
  "categoria",
  "marca",
  "precio",
  "stock",
  "imagen_url",
];

const EXPORTABLE_FIELDS = {
  nombre: "name",
  codigo_producto: "sku",
  descripcion: "description",
  categoria: "category",
  marca: "brand",
  precio: "price",
  stock: "stock",
  imagen_url: "imageUrl",
};

const productInclude = {
  categoryRelation: true,
  brandRelation: true,
  supplier: true,
};

function serializeProduct(product) {
  if (!product) return null;

  const categoryName = product.categoryRelation?.name || product.categoryLabel || null;
  const brandName = product.brandRelation?.name || product.brandLabel || null;

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: categoryName,
    categoryId: product.categoryId,
    brand: brandName,
    brandId: product.brandId,
    supplierId: product.supplierId,
    price: Number(product.price),
    stock: product.stock,
    imageUrl: product.imageUrl,
    image_url: product.imageUrl,
    isActive: product.isActive,
    is_active: product.isActive,
    createdAt: product.createdAt,
    created_at: product.createdAt,
    updatedAt: product.updatedAt,
    updated_at: product.updatedAt,
  };
}

async function resolveOptionalRelations({ category, brand, supplierId }) {
  const data = {};

  if (category !== undefined) {
    if (category?.trim()) {
      const record = await prisma.category.upsert({
        where: { name: category.trim() },
        update: {},
        create: { name: category.trim() },
      });
      data.categoryRelation = { connect: { id: record.id } };
      data.categoryLabel = record.name;
    } else {
      data.categoryId = null;
      data.categoryLabel = null;
    }
  }

  if (brand !== undefined) {
    if (brand?.trim()) {
      const record = await prisma.brand.upsert({
        where: { name: brand.trim() },
        update: {},
        create: { name: brand.trim() },
      });
      data.brandRelation = { connect: { id: record.id } };
      data.brandLabel = record.name;
    } else {
      data.brandId = null;
      data.brandLabel = null;
    }
  }

  if (supplierId !== undefined) {
    data.supplierId = supplierId || null;
  }

  return data;
}

function buildProductData(payload) {
  const data = {};

  if (payload.name !== undefined) data.name = String(payload.name).trim();
  if (payload.sku !== undefined) data.sku = payload.sku ? String(payload.sku).trim() : null;
  if (payload.description !== undefined) {
    data.description = payload.description ? String(payload.description).trim() : null;
  }
  if (payload.imageUrl !== undefined || payload.image_url !== undefined) {
    data.imageUrl = payload.imageUrl || payload.image_url || null;
  }
  if (payload.price !== undefined) data.price = new Prisma.Decimal(payload.price || 0);
  if (payload.stock !== undefined) data.stock = Number(payload.stock || 0);
  if (payload.isActive !== undefined || payload.is_active !== undefined) {
    data.isActive =
      payload.isActive !== undefined ? Boolean(payload.isActive) : Boolean(payload.is_active);
  }

  return data;
}

function assertValidProductPayload(payload, { partial = false } = {}) {
  const name = String(payload.name ?? "").trim();
  const sku = String(payload.sku ?? "").trim();
  const price = Number(payload.price ?? 0);
  const stock = Number(payload.stock ?? 0);

  if (!partial || payload.name !== undefined) {
    if (!name) throw new Error("El nombre del producto es obligatorio.");
  }

  if (payload.price !== undefined || !partial) {
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("El precio debe ser numérico y mayor o igual a 0.");
    }
  }

  if (payload.stock !== undefined || !partial) {
    if (!Number.isFinite(stock) || stock < 0) {
      throw new Error("El stock debe ser numérico y mayor o igual a 0.");
    }
  }

  if (payload.sku !== undefined && sku.length > 60) {
    throw new Error("El código de producto supera el límite permitido.");
  }
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvContent(content) {
  return String(content || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitCsvLine);
}

function validateCsvHeaders(headers) {
  if (headers.length !== CSV_HEADERS.length) return false;
  return CSV_HEADERS.every((header, index) => headers[index] === header);
}

function mapCsvRowToPayload(row) {
  const [
    nombre,
    codigoProducto,
    descripcion,
    categoria,
    marca,
    precio,
    stock,
    imagenUrl,
  ] = row;

  return {
    name: String(nombre || "").trim(),
    sku: String(codigoProducto || "").trim(),
    description: String(descripcion || "").trim(),
    category: String(categoria || "").trim(),
    brand: String(marca || "").trim(),
    price: Number(precio || 0),
    stock: Number(stock || 0),
    imageUrl: String(imagenUrl || "").trim(),
    isActive: true,
  };
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildExportValue(product, fieldName) {
  switch (fieldName) {
    case "price":
      return Number(product.price || 0).toFixed(2);
    case "stock":
      return Number(product.stock || 0);
    default:
      return product[fieldName] ?? "";
  }
}

export function getOfficialProductTemplateCsv() {
  return `${CSV_HEADERS.join(",")}\n`;
}

export async function listProductsPrisma() {
  const items = await prisma.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return items.map(serializeProduct);
}

export async function getProductPrisma(productId) {
  const item = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
  });

  return serializeProduct(item);
}

export async function createProductPrisma(payload) {
  assertValidProductPayload(payload);

  if (payload.sku) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: String(payload.sku).trim() },
      select: { id: true },
    });

    if (existingSku) {
      throw new Error("Ya existe un producto con ese código.");
    }
  }

  const relations = await resolveOptionalRelations(payload);
  const item = await prisma.product.create({
    data: {
      ...buildProductData(payload),
      ...relations,
    },
    include: productInclude,
  });

  return serializeProduct(item);
}

export async function updateProductPrisma(productId, payload) {
  assertValidProductPayload(payload, { partial: true });

  if (payload.sku) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: String(payload.sku).trim() },
      select: { id: true },
    });

    if (existingSku && existingSku.id !== productId) {
      throw new Error("Ya existe otro producto con ese código.");
    }
  }

  const relations = await resolveOptionalRelations(payload);
  const item = await prisma.product.update({
    where: { id: productId },
    data: {
      ...buildProductData(payload),
      ...relations,
    },
    include: productInclude,
  });

  return serializeProduct(item);
}

export async function deleteProductPrisma(productId) {
  await prisma.product.delete({
    where: { id: productId },
  });

  return { ok: true };
}

export async function toggleProductStatusPrisma(productId) {
  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { isActive: true },
  });

  if (!current) {
    throw new Error("Producto no encontrado");
  }

  const item = await prisma.product.update({
    where: { id: productId },
    data: { isActive: !current.isActive },
    include: productInclude,
  });

  return serializeProduct(item);
}

export async function importProductsCsvPrisma(csvContent) {
  const rows = parseCsvContent(csvContent);

  if (rows.length === 0 || !validateCsvHeaders(rows[0])) {
    throw new Error("El archivo no coincide con la plantilla oficial. Descarga la plantilla correcta.");
  }

  const summary = {
    created: 0,
    updated: 0,
    errors: 0,
    detail: [],
  };

  const dataRows = rows.slice(1);

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    const rowNumber = index + 2;

    if (!row.some((cell) => String(cell || "").trim() !== "")) {
      continue;
    }

    try {
      const payload = mapCsvRowToPayload(row.slice(0, CSV_HEADERS.length));

      if (!payload.name) {
        throw new Error("El nombre es obligatorio.");
      }

      if (!payload.sku) {
        throw new Error("El código de producto es obligatorio.");
      }

      if (!Number.isFinite(payload.price)) {
        throw new Error("El precio debe ser numérico.");
      }

      if (!Number.isFinite(payload.stock)) {
        throw new Error("El stock debe ser numérico.");
      }

      const existing = await prisma.product.findUnique({
        where: { sku: payload.sku },
        select: { id: true },
      });

      if (existing) {
        await updateProductPrisma(existing.id, payload);
        summary.updated += 1;
        summary.detail.push({ row: rowNumber, status: "ACTUALIZADO", sku: payload.sku });
      } else {
        await createProductPrisma(payload);
        summary.created += 1;
        summary.detail.push({ row: rowNumber, status: "CREADO", sku: payload.sku });
      }
    } catch (error) {
      summary.errors += 1;
      summary.detail.push({
        row: rowNumber,
        status: "ERROR",
        sku: row[1] || "",
        error: error.message || "Error desconocido",
      });
    }
  }

  return summary;
}

export async function exportProductsCsvPrisma(selectedColumns) {
  const columns = Array.isArray(selectedColumns) && selectedColumns.length > 0
    ? selectedColumns
    : CSV_HEADERS;

  const validColumns = columns.filter((column) => CSV_HEADERS.includes(column));

  if (validColumns.length === 0) {
    throw new Error("Selecciona al menos una columna válida para exportar.");
  }

  const products = await listProductsPrisma();
  const headerLine = validColumns.map(csvEscape).join(",");
  const dataLines = products.map((product) =>
    validColumns
      .map((column) => {
        const fieldName = EXPORTABLE_FIELDS[column];
        return csvEscape(buildExportValue(product, fieldName));
      })
      .join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

export async function adjustProductStockPrisma({
  productId,
  cantidad,
  tipo = "ENTRADA",
  descripcion,
}) {
  const amount = Number(cantidad || 0);
  const delta = tipo === "SALIDA" ? -Math.abs(amount) : Math.abs(amount);

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: productId },
      data: {
        stock: { increment: delta },
      },
      include: productInclude,
    });

    await tx.inventoryMovement.create({
      data: {
        productId,
        tipo,
        cantidad: Math.abs(amount),
        descripcion: descripcion || `Movimiento ${tipo.toLowerCase()} desde Prisma`,
      },
    });

    return product;
  });

  return serializeProduct(result);
}

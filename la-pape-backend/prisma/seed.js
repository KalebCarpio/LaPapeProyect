import "dotenv/config";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  Prisma,
  MovementType,
  Role,
  LoginMethod,
  OfferDiscountType,
  OfferScope,
  PaymentMethod,
  SaleStatus,
  CommercialEventType,
} from "@prisma/client";

const prisma = new PrismaClient();
const MAX_HISTORY_DAYS = 60;

function toUtcDateString(date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function atUtcHour(date, hour) {
  const next = new Date(date);
  next.setUTCHours(hour, 0, 0, 0);
  return next;
}

function decimal(value) {
  return new Prisma.Decimal(Number(value).toFixed(2));
}

function branchCode(branchKey) {
  return branchKey === "centro" ? "CENT" : "NORT";
}

function buildDeterministicDemand({
  pattern,
  dayIndex,
  productIndex,
  branchIndex,
  base,
  variability = 0,
  spikeEvery = 0,
  spikeSize = 0,
}) {
  const waveA = ((dayIndex + productIndex + branchIndex) % (variability + 3)) - 1;
  const waveB = ((dayIndex * (productIndex + 2) + branchIndex) % (variability + 5)) - 2;
  const weeklyBoost = dayIndex % 7 === 4 || dayIndex % 7 === 5 ? 1 : 0;
  const spike = spikeEvery > 0 && (dayIndex + productIndex + branchIndex) % spikeEvery === 0 ? spikeSize : 0;

  switch (pattern) {
    case "high_constant":
      return Math.max(0, base + Math.max(0, waveA) + weeklyBoost + spike);
    case "low_sporadic":
      if ((dayIndex + productIndex + branchIndex) % 8 !== 0 && (dayIndex + productIndex) % 13 !== 0) {
        return 0;
      }
      return Math.max(1, base + (dayIndex % 2) + spike);
    case "variable":
      return Math.max(0, base + waveA + waveB + weeklyBoost + spike);
    case "risk_high":
      return Math.max(0, base + Math.max(0, waveA) + Math.max(0, waveB) + weeklyBoost + spike);
    case "steady_low":
      return Math.max(0, base + (dayIndex % 6 === 0 ? 1 : 0) + spike);
    default:
      return Math.max(0, base + weeklyBoost + spike);
  }
}

async function main() {
  const categoryDefinitions = [
    {
      key: "cuadernos",
      name: "Cuadernos",
      description: "Libretas, blocks y cuadernos para uso escolar y profesional.",
    },
    {
      key: "arte",
      name: "Arte",
      description: "Material creativo, dibujo, color y expresion visual.",
    },
    {
      key: "oficina",
      name: "Oficina",
      description: "Accesorios y suministros para escritorio y productividad.",
    },
  ];

  const categories = {};
  for (const definition of categoryDefinitions) {
    categories[definition.key] = await prisma.category.upsert({
      where: { name: definition.name },
      update: {
        description: definition.description,
        isActive: true,
      },
      create: {
        name: definition.name,
        description: definition.description,
        isActive: true,
      },
    });
  }

  const brandDefinitions = [
    "Scribe",
    "Maped",
    "BIC",
    "Pelikan",
    "Barrilito",
    "Norma",
  ];

  const brands = {};
  for (const brandName of brandDefinitions) {
    brands[brandName] = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });
  }

  const supplier = await prisma.supplier.upsert({
    where: { email: "proveedor@lapape.local" },
    update: {},
    create: {
      name: "Distribuidora Escolar MX",
      telefono: "555-101-2020",
      email: "proveedor@lapape.local",
    },
  });

  const branchCenter = await prisma.branch.upsert({
    where: { id: "91c41ff6-2b84-4fdd-b873-f1c729a42001" },
    update: {},
    create: {
      id: "91c41ff6-2b84-4fdd-b873-f1c729a42001",
      name: "Sucursal Centro",
      direccion: "Av. Principal 123, Centro",
    },
  });

  const branchNorth = await prisma.branch.upsert({
    where: { id: "91c41ff6-2b84-4fdd-b873-f1c729a42002" },
    update: {},
    create: {
      id: "91c41ff6-2b84-4fdd-b873-f1c729a42002",
      name: "Sucursal Norte",
      direccion: "Av. Norte 45, Plaza Comercial",
    },
  });

  const branches = [
    { key: "centro", record: branchCenter, index: 0 },
    { key: "norte", record: branchNorth, index: 1 },
  ];

  const customer = await prisma.customer.upsert({
    where: { email: "cliente.demo@lapape.local" },
    update: {},
    create: {
      nombre: "Cliente Demo",
      telefono: "555-202-3030",
      email: "cliente.demo@lapape.local",
    },
  });

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const owner = await prisma.user.upsert({
    where: { email: "dueno@lapape.local" },
    update: {},
    create: {
      nombre: "Dueño Demo",
      email: "dueno@lapape.local",
      passwordHash,
      rol: Role.DUENO,
      isVerified: true,
      twoFAEnabled: false,
      loginMethod: LoginMethod.PASSWORD_ONLY,
      sessions: [],
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@lapape.local" },
    update: {},
    create: {
      nombre: "Admin Comercial",
      email: "admin@lapape.local",
      passwordHash,
      rol: Role.ADMIN,
      isVerified: true,
      twoFAEnabled: false,
      loginMethod: LoginMethod.PASSWORD_ONLY,
      sessions: [],
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: "caja.centro@lapape.local" },
    update: {},
    create: {
      nombre: "Caja Centro",
      email: "caja.centro@lapape.local",
      passwordHash,
      rol: Role.TRABAJADOR,
      isVerified: true,
      twoFAEnabled: false,
      loginMethod: LoginMethod.PASSWORD_ONLY,
      sessions: [],
    },
  });

  const productDefinitions = [
    {
      sku: "LAP-CUA-001",
      name: "Cuaderno profesional cuadriculado",
      description: "Cuaderno profesional de 100 hojas para uso escolar y oficina.",
      categoryKey: "cuadernos",
      brandName: "Scribe",
      price: 89.9,
      imageUrl: "/products/cuaderno.jpg",
      historyDays: 60,
      behavior: "Alta demanda constante con reabasto frecuente.",
      branches: {
        centro: { stock: 24, pattern: "high_constant", base: 6, variability: 2, spikeEvery: 12, spikeSize: 2 },
        norte: { stock: 14, pattern: "high_constant", base: 3, variability: 1, spikeEvery: 14, spikeSize: 1 },
      },
    },
    {
      sku: "LAP-MAR-005",
      name: "Marcadores permanentes 5 piezas",
      description: "Set de marcadores para cartulina, cartón y papel.",
      categoryKey: "arte",
      brandName: "Maped",
      price: 75,
      imageUrl: "/products/marcadores.webp",
      historyDays: 60,
      behavior: "Demanda variable con semanas de mayor movimiento.",
      branches: {
        centro: { stock: 18, pattern: "variable", base: 2, variability: 3, spikeEvery: 10, spikeSize: 3 },
        norte: { stock: 10, pattern: "variable", base: 1, variability: 3, spikeEvery: 9, spikeSize: 2 },
      },
    },
    {
      sku: "LAP-PLU-010",
      name: "Plumas gel azules 10 piezas",
      description: "Caja con plumas de tinta gel para uso escolar y oficina.",
      categoryKey: "oficina",
      brandName: "BIC",
      price: 68.5,
      imageUrl: "/products/plumas-gel.jpg",
      historyDays: 60,
      behavior: "Alta demanda estable, con mejor rotación en sucursal Centro.",
      branches: {
        centro: { stock: 32, pattern: "high_constant", base: 5, variability: 2, spikeEvery: 11, spikeSize: 2 },
        norte: { stock: 18, pattern: "high_constant", base: 2, variability: 1, spikeEvery: 15, spikeSize: 1 },
      },
    },
    {
      sku: "LAP-HOJ-020",
      name: "Paquete hojas blancas carta 500",
      description: "Resma de hojas blancas de alta rotación para impresión y copiado.",
      categoryKey: "oficina",
      brandName: "Norma",
      price: 129,
      imageUrl: "/products/hojas-carta.jpg",
      historyDays: 55,
      behavior: "Riesgo de desabasto por demanda alta y stock corto.",
      branches: {
        centro: { stock: 14, pattern: "risk_high", base: 5, variability: 2, spikeEvery: 8, spikeSize: 3 },
        norte: { stock: 8, pattern: "risk_high", base: 4, variability: 2, spikeEvery: 9, spikeSize: 2 },
      },
    },
    {
      sku: "LAP-PEG-015",
      name: "Pegamento escolar 125 g",
      description: "Pegamento liquido para manualidades y trabajos escolares.",
      categoryKey: "arte",
      brandName: "Barrilito",
      price: 24.9,
      imageUrl: "/products/pegamento.jpg",
      historyDays: 45,
      behavior: "Baja demanda con exceso de stock y cobertura amplia.",
      branches: {
        centro: { stock: 70, pattern: "low_sporadic", base: 1, variability: 1, spikeEvery: 0, spikeSize: 0 },
        norte: { stock: 55, pattern: "low_sporadic", base: 1, variability: 1, spikeEvery: 0, spikeSize: 0 },
      },
    },
    {
      sku: "LAP-CAR-030",
      name: "Cartulina iris surtida",
      description: "Piezas de cartulina para proyectos escolares con variación de demanda.",
      categoryKey: "arte",
      brandName: "Maped",
      price: 18.5,
      imageUrl: "/products/cartulina.jpg",
      historyDays: 50,
      behavior: "Demanda variable con picos por trabajos escolares.",
      branches: {
        centro: { stock: 18, pattern: "variable", base: 2, variability: 4, spikeEvery: 7, spikeSize: 4 },
        norte: { stock: 14, pattern: "variable", base: 1, variability: 3, spikeEvery: 9, spikeSize: 3 },
      },
    },
    {
      sku: "LAP-COL-011",
      name: "Colores de madera 24 piezas",
      description: "Estuche de colores de madera con demanda distinta por sucursal.",
      categoryKey: "arte",
      brandName: "Pelikan",
      price: 94,
      imageUrl: "/products/colores-24.jpg",
      historyDays: 60,
      behavior: "Mismo producto con alta rotación en Centro y baja en Norte.",
      branches: {
        centro: { stock: 22, pattern: "high_constant", base: 4, variability: 2, spikeEvery: 10, spikeSize: 2 },
        norte: { stock: 60, pattern: "steady_low", base: 1, variability: 1, spikeEvery: 0, spikeSize: 0 },
      },
    },
    {
      sku: "LAP-ENG-040",
      name: "Engrapadora metálica mediana",
      description: "Artículo de oficina con rotación baja y stock sobrante.",
      categoryKey: "oficina",
      brandName: "BIC",
      price: 119,
      imageUrl: "/products/engrapadora.jpg",
      historyDays: 45,
      behavior: "Baja demanda y exceso de stock sostenido.",
      branches: {
        centro: { stock: 48, pattern: "low_sporadic", base: 1, variability: 1, spikeEvery: 0, spikeSize: 0 },
        norte: { stock: 52, pattern: "low_sporadic", base: 1, variability: 1, spikeEvery: 0, spikeSize: 0 },
      },
    },
    {
      sku: "LAP-FOM-050",
      name: "Foami carta colores surtidos",
      description: "Material de manualidades con demanda irregular y por proyectos.",
      categoryKey: "arte",
      brandName: "Barrilito",
      price: 42.5,
      imageUrl: "/products/foami.jpg",
      historyDays: 50,
      behavior: "Consumo variable con ruido y picos puntuales.",
      branches: {
        centro: { stock: 26, pattern: "variable", base: 2, variability: 3, spikeEvery: 6, spikeSize: 3 },
        norte: { stock: 18, pattern: "variable", base: 1, variability: 3, spikeEvery: 8, spikeSize: 2 },
      },
    },
    {
      sku: "LAP-TIN-060",
      name: "Tinta para sellos azul 30 ml",
      description: "Consumible de oficina con demanda baja y estable.",
      categoryKey: "oficina",
      brandName: "Pelikan",
      price: 54,
      imageUrl: "/products/tinta-sellos.jpg",
      historyDays: 45,
      behavior: "Demanda baja, con cobertura alta y sin urgencia de reabasto.",
      branches: {
        centro: { stock: 28, pattern: "steady_low", base: 1, variability: 1, spikeEvery: 0, spikeSize: 0 },
        norte: { stock: 30, pattern: "steady_low", base: 1, variability: 1, spikeEvery: 0, spikeSize: 0 },
      },
    },
  ];

  const productsBySku = {};

  for (const definition of productDefinitions) {
    const totalStock = Object.values(definition.branches).reduce((sum, profile) => sum + profile.stock, 0);

    const product = await prisma.product.upsert({
      where: { sku: definition.sku },
      update: {
        name: definition.name,
        description: definition.description,
        categoryLabel: categories[definition.categoryKey].name,
        brandLabel: definition.brandName,
        categoryRelation: { connect: { id: categories[definition.categoryKey].id } },
        brandRelation: { connect: { id: brands[definition.brandName].id } },
        supplier: { connect: { id: supplier.id } },
        price: decimal(definition.price),
        stock: totalStock,
        imageUrl: definition.imageUrl,
        isActive: true,
      },
      create: {
        name: definition.name,
        sku: definition.sku,
        description: definition.description,
        categoryLabel: categories[definition.categoryKey].name,
        brandLabel: definition.brandName,
        categoryRelation: { connect: { id: categories[definition.categoryKey].id } },
        brandRelation: { connect: { id: brands[definition.brandName].id } },
        supplier: { connect: { id: supplier.id } },
        price: decimal(definition.price),
        stock: totalStock,
        imageUrl: definition.imageUrl,
        isActive: true,
      },
    });

    productsBySku[definition.sku] = product;

    for (const branchMeta of branches) {
      await prisma.branchStock.upsert({
        where: {
          branchId_productId: {
            branchId: branchMeta.record.id,
            productId: product.id,
          },
        },
        update: { stock: definition.branches[branchMeta.key].stock },
        create: {
          branchId: branchMeta.record.id,
          productId: product.id,
          stock: definition.branches[branchMeta.key].stock,
        },
      });
    }
  }

  const initialSaleFolio = `VT-CENT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`;

  const initialSale = await prisma.sale.upsert({
    where: { folio: initialSaleFolio },
    update: {},
    create: {
      folio: initialSaleFolio,
      userId: owner.id,
      customerId: customer.id,
      branchId: branchCenter.id,
      paymentMethod: PaymentMethod.TARJETA,
      status: SaleStatus.COMPLETADA,
      subtotal: decimal(164.9),
      discount: decimal(0),
      total: decimal(164.9),
      notes: "Venta seed inicial",
      saleDetails: {
        create: [
          {
            productId: productsBySku["LAP-CUA-001"].id,
            cantidad: 1,
            returnedQuantity: 0,
            precio: decimal(89.9),
            unitDiscount: decimal(0),
            lineSubtotal: decimal(89.9),
            lineDiscount: decimal(0),
            lineTotal: decimal(89.9),
          },
          {
            productId: productsBySku["LAP-MAR-005"].id,
            cantidad: 1,
            returnedQuantity: 0,
            precio: decimal(75),
            unitDiscount: decimal(0),
            lineSubtotal: decimal(75),
            lineDiscount: decimal(0),
            lineTotal: decimal(75),
          },
        ],
      },
    },
  });

  await prisma.commercialEvent.upsert({
    where: { id: "1f7d6f10-0d13-40bf-8f01-4fe0d0f10003" },
    update: {
      saleId: initialSale.id,
      branchId: branchCenter.id,
      userId: owner.id,
      type: CommercialEventType.VENTA_CREADA,
      action: "SALE_CREATED",
      folio: initialSale.folio,
      description: `Seed comercial: venta ${initialSale.folio} creada.`,
      metadata: {
        paymentMethod: PaymentMethod.TARJETA,
        total: 164.9,
      },
    },
    create: {
      id: "1f7d6f10-0d13-40bf-8f01-4fe0d0f10003",
      saleId: initialSale.id,
      branchId: branchCenter.id,
      userId: owner.id,
      type: CommercialEventType.VENTA_CREADA,
      action: "SALE_CREATED",
      folio: initialSale.folio,
      description: `Seed comercial: venta ${initialSale.folio} creada.`,
      metadata: {
        paymentMethod: PaymentMethod.TARJETA,
        total: 164.9,
      },
    },
  });

  await prisma.commercialEvent.upsert({
    where: { id: "1f7d6f10-0d13-40bf-8f01-4fe0d0f10004" },
    update: {
      saleId: initialSale.id,
      branchId: branchCenter.id,
      userId: admin.id,
      type: CommercialEventType.TICKET_REIMPRESO,
      action: "SALE_TICKET_REPRINTED",
      folio: initialSale.folio,
      description: `Seed comercial: ticket de ${initialSale.folio} reimpreso.`,
      metadata: {
        reprintCount: 1,
      },
    },
    create: {
      id: "1f7d6f10-0d13-40bf-8f01-4fe0d0f10004",
      saleId: initialSale.id,
      branchId: branchCenter.id,
      userId: admin.id,
      type: CommercialEventType.TICKET_REIMPRESO,
      action: "SALE_TICKET_REPRINTED",
      folio: initialSale.folio,
      description: `Seed comercial: ticket de ${initialSale.folio} reimpreso.`,
      metadata: {
        reprintCount: 1,
      },
    },
  });

  const existingHistoricalSales = await prisma.sale.findMany({
    where: { folio: { startsWith: "HIST-" } },
    select: { id: true },
  });

  if (existingHistoricalSales.length > 0) {
    const historicalSaleIds = existingHistoricalSales.map((sale) => sale.id);
    await prisma.saleDetail.deleteMany({
      where: {
        saleId: { in: historicalSaleIds },
      },
    });
    await prisma.sale.deleteMany({
      where: {
        id: { in: historicalSaleIds },
      },
    });
  }

  const today = atUtcHour(new Date(), 11);

  for (let offset = MAX_HISTORY_DAYS; offset >= 1; offset -= 1) {
    const date = addUtcDays(today, -offset);
    const dayIndex = MAX_HISTORY_DAYS - offset;

    for (const branchMeta of branches) {
      const saleLines = [];

      for (const [productIndex, definition] of productDefinitions.entries()) {
        if (dayIndex < MAX_HISTORY_DAYS - definition.historyDays) {
          continue;
        }

        const branchProfile = definition.branches[branchMeta.key];
        const quantity = buildDeterministicDemand({
          pattern: branchProfile.pattern,
          dayIndex,
          productIndex,
          branchIndex: branchMeta.index,
          base: branchProfile.base,
          variability: branchProfile.variability,
          spikeEvery: branchProfile.spikeEvery,
          spikeSize: branchProfile.spikeSize,
        });

        if (quantity <= 0) {
          continue;
        }

        saleLines.push({
          productId: productsBySku[definition.sku].id,
          sku: definition.sku,
          categoryKey: definition.categoryKey,
          quantity,
          price: definition.price,
        });
      }

      if (saleLines.length === 0) {
        continue;
      }

      const subtotal = saleLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
      const hasNotebookLine = saleLines.some((line) => line.categoryKey === "cuadernos");
      const hasPaperLine = saleLines.some((line) => line.sku === "LAP-HOJ-020");
      const discount = hasNotebookLine && dayIndex % 14 === 0 ? 18 : hasPaperLine && dayIndex % 9 === 0 ? 12 : 0;
      const total = Math.max(0, subtotal - discount);
      const folio = `HIST-${branchCode(branchMeta.key)}-${toUtcDateString(date).replace(/-/g, "")}-${String(dayIndex + 1).padStart(3, "0")}`;
      const paymentMethodCycle = [PaymentMethod.EFECTIVO, PaymentMethod.TARJETA, PaymentMethod.TRANSFERENCIA];
      const paymentMethod = paymentMethodCycle[(dayIndex + branchMeta.index) % paymentMethodCycle.length];
      const seller = branchMeta.key === "centro" ? (dayIndex % 3 === 0 ? admin : worker) : admin;

      await prisma.sale.create({
        data: {
          folio,
          userId: seller.id,
          customerId: customer.id,
          branchId: branchMeta.record.id,
          paymentMethod,
          status: SaleStatus.COMPLETADA,
          subtotal: decimal(subtotal),
          discount: decimal(discount),
          total: decimal(total),
          notes: "Venta historica para analisis predictivo",
          createdAt: date,
          updatedAt: date,
          saleDetails: {
            create: saleLines.map((line, lineIndex) => {
              const lineSubtotal = line.quantity * line.price;
              const lineDiscount = discount > 0 && lineIndex === 0 ? Math.min(discount, lineSubtotal) : 0;

              return {
                productId: line.productId,
                cantidad: line.quantity,
                returnedQuantity: 0,
                precio: decimal(line.price),
                unitDiscount: decimal(line.quantity > 0 ? lineDiscount / line.quantity : 0),
                lineSubtotal: decimal(lineSubtotal),
                lineDiscount: decimal(lineDiscount),
                lineTotal: decimal(lineSubtotal - lineDiscount),
                createdAt: date,
                updatedAt: date,
              };
            }),
          },
        },
      });
    }
  }

  await prisma.inventoryMovement.deleteMany({
    where: {
      descripcion: {
        startsWith: "Seed forecast:",
      },
    },
  });

  await prisma.inventoryMovement.createMany({
    data: productDefinitions.map((definition) => ({
      productId: productsBySku[definition.sku].id,
      tipo: MovementType.ENTRADA,
      cantidad: Object.values(definition.branches).reduce((sum, profile) => sum + profile.stock, 0),
      descripcion: `Seed forecast: carga base para ${definition.sku}`,
    })),
  });

  await prisma.offer.upsert({
    where: { id: "0f7d6f10-0d13-40bf-8f01-4fe0d0f10001" },
    update: {
      name: "Regreso a clases",
      description: "Campana para elevar ticket promedio en articulos escolares.",
      discountType: OfferDiscountType.PERCENTAGE,
      discountValue: decimal(15),
      appliesTo: OfferScope.CATEGORY,
      categoryId: categories.cuadernos.id,
      productId: null,
      startsAt: new Date("2026-04-10T00:00:00.000Z"),
      endsAt: new Date("2026-04-30T00:00:00.000Z"),
      isActive: true,
    },
    create: {
      id: "0f7d6f10-0d13-40bf-8f01-4fe0d0f10001",
      name: "Regreso a clases",
      description: "Campana para elevar ticket promedio en articulos escolares.",
      discountType: OfferDiscountType.PERCENTAGE,
      discountValue: decimal(15),
      appliesTo: OfferScope.CATEGORY,
      categoryId: categories.cuadernos.id,
      startsAt: new Date("2026-04-10T00:00:00.000Z"),
      endsAt: new Date("2026-04-30T00:00:00.000Z"),
      isActive: true,
    },
  });

  await prisma.offer.upsert({
    where: { id: "0f7d6f10-0d13-40bf-8f01-4fe0d0f10002" },
    update: {
      name: "Impulso marcador",
      description: "Promocion puntual para acelerar rotacion del set de marcadores.",
      discountType: OfferDiscountType.FIXED,
      discountValue: decimal(20),
      appliesTo: OfferScope.PRODUCT,
      productId: productsBySku["LAP-MAR-005"].id,
      categoryId: null,
      startsAt: new Date("2026-04-11T00:00:00.000Z"),
      endsAt: new Date("2026-04-18T00:00:00.000Z"),
      isActive: false,
    },
    create: {
      id: "0f7d6f10-0d13-40bf-8f01-4fe0d0f10002",
      name: "Impulso marcador",
      description: "Promocion puntual para acelerar rotacion del set de marcadores.",
      discountType: OfferDiscountType.FIXED,
      discountValue: decimal(20),
      appliesTo: OfferScope.PRODUCT,
      productId: productsBySku["LAP-MAR-005"].id,
      startsAt: new Date("2026-04-11T00:00:00.000Z"),
      endsAt: new Date("2026-04-18T00:00:00.000Z"),
      isActive: false,
    },
  });

  await prisma.backupLog.deleteMany({
    where: {
      descripcion: "Seed inicial aplicado con Prisma",
    },
  });

  await prisma.backupLog.create({
    data: {
      backupType: "COMPLETO",
      fileName: "lapape_backup_seed_demo.tar",
      includedTables: ["products", "categories", "brands", "sales", "sale_details", "branch_stock"],
      filePath: "/tmp/lapape_backup_seed_demo.tar",
      fileSize: BigInt(0),
      status: "GENERADO",
      fecha: new Date(),
      descripcion: "Seed inicial aplicado con Prisma",
    },
  });

  await prisma.systemAuditLog.deleteMany({
    where: {
      accion: "SEED_INIT",
    },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: owner.id,
      accion: "SEED_INIT",
      descripcion: `Seed Prisma ejecutado. Historial comercial regenerado con ${productDefinitions.length} productos.`,
    },
  });

  console.log("✅ Seed Prisma ejecutado correctamente");
}

main()
  .catch((error) => {
    console.error("❌ Error en seed Prisma:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

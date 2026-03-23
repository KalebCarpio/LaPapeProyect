import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, Prisma, MovementType, Role, LoginMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [categoriaCuadernos, categoriaArte, categoriaOficina] = await Promise.all([
    prisma.category.upsert({
      where: { name: "Cuadernos" },
      update: {},
      create: { name: "Cuadernos" },
    }),
    prisma.category.upsert({
      where: { name: "Arte" },
      update: {},
      create: { name: "Arte" },
    }),
    prisma.category.upsert({
      where: { name: "Oficina" },
      update: {},
      create: { name: "Oficina" },
    }),
  ]);

  const [marcaScribe, marcaMaped] = await Promise.all([
    prisma.brand.upsert({
      where: { name: "Scribe" },
      update: {},
      create: { name: "Scribe" },
    }),
    prisma.brand.upsert({
      where: { name: "Maped" },
      update: {},
      create: { name: "Maped" },
    }),
  ]);

  const supplier = await prisma.supplier.upsert({
    where: { email: "proveedor@lapape.local" },
    update: {},
    create: {
      name: "Distribuidora Escolar MX",
      telefono: "555-101-2020",
      email: "proveedor@lapape.local",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { id: "91c41ff6-2b84-4fdd-b873-f1c729a42001" },
    update: {},
    create: {
      id: "91c41ff6-2b84-4fdd-b873-f1c729a42001",
      name: "Sucursal Centro",
      direccion: "Av. Principal 123, Centro",
    },
  });

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

  const [productOne, productTwo] = await Promise.all([
    prisma.product.upsert({
      where: { sku: "LAP-CUA-001" },
      update: {},
      create: {
        name: "Cuaderno profesional cuadriculado",
        sku: "LAP-CUA-001",
        description: "Cuaderno profesional de 100 hojas para uso escolar y oficina.",
        categoryLabel: categoriaCuadernos.name,
        brandLabel: marcaScribe.name,
        categoryRelation: { connect: { id: categoriaCuadernos.id } },
        brandRelation: { connect: { id: marcaScribe.id } },
        supplier: { connect: { id: supplier.id } },
        price: new Prisma.Decimal("89.90"),
        stock: 28,
        imageUrl: "/products/cuaderno.jpg",
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: "LAP-MAR-005" },
      update: {},
      create: {
        name: "Marcadores permanentes 5 piezas",
        sku: "LAP-MAR-005",
        description: "Set de marcadores para cartulina, cartón y papel.",
        categoryLabel: categoriaArte.name,
        brandLabel: marcaMaped.name,
        categoryRelation: { connect: { id: categoriaArte.id } },
        brandRelation: { connect: { id: marcaMaped.id } },
        supplier: { connect: { id: supplier.id } },
        price: new Prisma.Decimal("75.00"),
        stock: 12,
        imageUrl: "/products/marcadores.webp",
        isActive: true,
      },
    }),
  ]);

  await prisma.branchStock.upsert({
    where: {
      branchId_productId: {
        branchId: branch.id,
        productId: productOne.id,
      },
    },
    update: { stock: 18 },
    create: {
      branchId: branch.id,
      productId: productOne.id,
      stock: 18,
    },
  });

  const sale = await prisma.sale.create({
    data: {
      userId: owner.id,
      customerId: customer.id,
      branchId: branch.id,
      total: new Prisma.Decimal("164.90"),
      saleDetails: {
        create: [
          {
            productId: productOne.id,
            cantidad: 1,
            precio: new Prisma.Decimal("89.90"),
          },
          {
            productId: productTwo.id,
            cantidad: 1,
            precio: new Prisma.Decimal("75.00"),
          },
        ],
      },
    },
  });

  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: productOne.id,
        tipo: MovementType.ENTRADA,
        cantidad: 30,
        descripcion: "Carga inicial de inventario",
      },
      {
        productId: productTwo.id,
        tipo: MovementType.ENTRADA,
        cantidad: 15,
        descripcion: "Carga inicial de inventario",
      },
    ],
  });

  await prisma.backupLog.create({
    data: {
      backupType: "COMPLETO",
      fileName: "lapape_backup_seed_demo.tar",
      includedTables: ["products", "categories", "brands"],
      filePath: "/tmp/lapape_backup_seed_demo.tar",
      fileSize: BigInt(0),
      status: "GENERADO",
      fecha: new Date(),
      descripcion: "Seed inicial aplicado con Prisma",
    },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: owner.id,
      accion: "SEED_INIT",
      descripcion: `Seed Prisma ejecutado. Venta demo creada: ${sale.id}`,
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

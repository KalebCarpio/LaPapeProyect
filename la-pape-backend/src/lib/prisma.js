import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function connectPrisma() {
  await prisma.$connect();
  console.log("✅ Prisma conectado");
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}

import { prisma } from "../lib/prisma.js";

function serializeBranch(branch) {
  if (!branch) return null;

  const availableProducts = branch.branchStocks?.filter((item) => item.stock > 0).length ?? 0;
  const totalStock = branch.branchStocks?.reduce((sum, item) => sum + item.stock, 0) ?? 0;

  return {
    id: branch.id,
    name: branch.name,
    direccion: branch.direccion,
    productLines: branch.branchStocks?.length ?? 0,
    availableProducts,
    totalStock,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

export async function listBranchesPrisma() {
  const items = await prisma.branch.findMany({
    include: {
      branchStocks: {
        select: {
          stock: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return items.map(serializeBranch);
}

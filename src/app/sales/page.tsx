import { prisma } from "@/lib/prisma";
import { SalesClient } from "./sales-client";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const [sales, products, customers] = await Promise.all([
    prisma.sale.findMany({
      where: q
        ? {
            OR: [
              { product: { name: { contains: q, mode: "insensitive" } } },
              { customer: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : undefined,
      include: {
        product: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { soldAt: "desc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, price: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const rows = sales.map((sale) => ({
    id: sale.id,
    productId: sale.productId,
    productName: sale.product.name,
    customerId: sale.customerId,
    customerName: sale.customer?.name ?? null,
    quantity: sale.quantity,
    totalPrice: sale.totalPrice,
    soldAt: sale.soldAt,
  }));

  return (
    <SalesClient
      sales={rows}
      products={products}
      customers={customers}
      searchQuery={q ?? ""}
    />
  );
}

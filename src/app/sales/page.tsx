import { prisma } from "@/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/lib/date-utils";
import { SalesClient } from "./sales-client";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string }>;
}) {
  const { q, from, to } = await searchParams;

  const soldAtFilter: { gte?: Date; lte?: Date } = {};

  const fromDate = parseDateStart(from);
  if (fromDate) soldAtFilter.gte = fromDate;

  const toDate = parseDateEnd(to);
  if (toDate) soldAtFilter.lte = toDate;

  const where = {
    ...(q
      ? {
        OR: [
          { product: { name: { contains: q, mode: "insensitive" as const } } },
          { customer: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
      : {}),
    ...(soldAtFilter.gte || soldAtFilter.lte
      ? {
        soldAt: soldAtFilter,
      }
      : {}),
  };

  const [sales, products, customers] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        product: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { soldAt: "desc" },
      take: 500,
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
      dateFrom={from ?? ""}
      dateTo={to ?? ""}
    />
  );
}

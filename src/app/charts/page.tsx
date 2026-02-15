import { prisma } from "@/lib/prisma";
import { ChartsClient, type ChartRange } from "./charts-client";

const RANGE_DAY_MAP: Record<ChartRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
};

function isChartRange(value: string | undefined): value is ChartRange {
  return value === "7d" || value === "30d" || value === "90d" || value === "180d";
}

export default async function ChartsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: ChartRange = isChartRange(rangeParam) ? rangeParam : "30d";

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - RANGE_DAY_MAP[range]);

  const groupedSales = await prisma.sale.groupBy({
    by: ["productId"],
    where: {
      soldAt: {
        gte: startDate,
      },
    },
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    _count: {
      _all: true,
    },
  });

  const productIds = groupedSales.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const productNameMap = new Map(products.map((product) => [product.id, product.name]));

  const chartData = groupedSales
    .map((item) => ({
      productId: item.productId,
      productName: productNameMap.get(item.productId) ?? "Produk tidak dikenal",
      quantity: item._sum.quantity ?? 0,
      revenue: item._sum.totalPrice ?? 0,
      transactions: item._count._all,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  const totalQuantity = chartData.reduce((acc, item) => acc + item.quantity, 0);
  const totalRevenue = chartData.reduce((acc, item) => acc + item.revenue, 0);
  const totalTransactions = chartData.reduce((acc, item) => acc + item.transactions, 0);

  return (
    <ChartsClient
      range={range}
      chartData={chartData}
      totalQuantity={totalQuantity}
      totalRevenue={totalRevenue}
      totalTransactions={totalTransactions}
    />
  );
}

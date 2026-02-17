import { prisma } from "@/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/lib/date-utils";
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
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range: rangeParam, from, to } = await searchParams;
  const range: ChartRange = isChartRange(rangeParam) ? rangeParam : "30d";

  const now = new Date();
  const fallbackStartDate = new Date(now);
  fallbackStartDate.setDate(fallbackStartDate.getDate() - RANGE_DAY_MAP[range]);

  const parsedFrom = parseDateStart(from);
  const parsedTo = parseDateEnd(to);

  const startDate = parsedFrom ?? fallbackStartDate;
  const endDate = parsedTo ?? now;

  const where = {
    soldAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [groupedSales, salesWithTags] = await Promise.all([
    prisma.sale.groupBy({
      by: ["productId"],
      where,
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.sale.findMany({
      where,
      select: {
        quantity: true,
        totalPrice: true,
        customer: {
          select: {
            customerTags: {
              select: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const tagMap = new Map<
    string,
    {
      tagId: string;
      tagName: string;
      quantity: number;
      revenue: number;
      transactions: number;
    }
  >();

  for (const sale of salesWithTags) {
    const tags = sale.customer?.customerTags?.map((ct) => ct.tag) ?? [];

    for (const tag of tags) {
      const current = tagMap.get(tag.id);

      if (current) {
        current.quantity += sale.quantity;
        current.revenue += sale.totalPrice;
        current.transactions += 1;
        continue;
      }

      tagMap.set(tag.id, {
        tagId: tag.id,
        tagName: tag.name,
        quantity: sale.quantity,
        revenue: sale.totalPrice,
        transactions: 1,
      });
    }
  }

  const tagsChartData = [...tagMap.values()].sort((a, b) => b.transactions - a.transactions).slice(0, 8);

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

  const productsChartData = groupedSales
    .map((item) => ({
      productId: item.productId,
      productName: productNameMap.get(item.productId) ?? "Produk tidak dikenal",
      quantity: item._sum.quantity ?? 0,
      revenue: item._sum.totalPrice ?? 0,
      transactions: item._count._all,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  const totalQuantity = productsChartData.reduce((acc, item) => acc + item.quantity, 0);
  const totalRevenue = productsChartData.reduce((acc, item) => acc + item.revenue, 0);
  const totalTransactions = productsChartData.reduce((acc, item) => acc + item.transactions, 0);

  return (
    <ChartsClient
      range={range}
      from={from ?? ""}
      to={to ?? ""}
      productsChartData={productsChartData}
      tagsChartData={tagsChartData}
      totalQuantity={totalQuantity}
      totalRevenue={totalRevenue}
      totalTransactions={totalTransactions}
    />
  );
}

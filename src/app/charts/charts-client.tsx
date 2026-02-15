"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type ChartRange = "7d" | "30d" | "90d" | "180d";

const RANGE_OPTIONS: Array<{ label: string; value: ChartRange }> = [
  { label: "7 Hari", value: "7d" },
  { label: "30 Hari", value: "30d" },
  { label: "90 Hari", value: "90d" },
  { label: "180 Hari", value: "180d" },
];

const chartConfig = {
  quantity: {
    label: "Cup Terjual",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ChartsClient({
  range,
  chartData,
  totalQuantity,
  totalRevenue,
  totalTransactions,
}: {
  range: ChartRange;
  chartData: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    transactions: number;
  }>;
  totalQuantity: number;
  totalRevenue: number;
  totalTransactions: number;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Charts"
        description="Pantau performa produk berdasarkan rentang waktu penjualan."
      />

      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={range === option.value ? "default" : "neutral"}
            onClick={() => router.push(`/charts?range=${option.value}`)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Cup Terjual</CardTitle>
            <CardDescription>Dari produk terlaris pada periode ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-heading">{totalQuantity.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Akumulasi omset dari chart produk</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-heading">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Transaksi</CardTitle>
            <CardDescription>Jumlah transaksi pada produk teratas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-heading">{totalTransactions.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products by Quantity</CardTitle>
          <CardDescription>Semakin tinggi bar, semakin banyak cup terjual</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length ? (
            <ChartContainer config={chartConfig} className="h-[360px] w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                barCategoryGap={10}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="productName"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="rounded-base border-2 border-border bg-secondary-background p-6 text-sm text-foreground/70">
              Belum ada data penjualan pada rentang waktu ini.
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-foreground/70">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Data menampilkan 8 produk dengan quantity tertinggi.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

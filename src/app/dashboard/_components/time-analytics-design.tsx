import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TimeAnalyticsDesign() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time-based Analytics (Design Ready)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground/70">
          Struktur data saat ini sudah siap dipakai untuk analitik harian, mingguan,
          dan bulanan menggunakan field penjualan yang ada.
        </p>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList>
            <TabsTrigger value="daily">Harian</TabsTrigger>
            <TabsTrigger value="weekly">Mingguan</TabsTrigger>
            <TabsTrigger value="monthly">Bulanan</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-2">
            <div className="rounded-base border-2 border-border bg-secondary-background p-3">
              <p className="font-heading text-sm">X-Axis</p>
              <p className="text-sm">`sale.soldAt` per jam / tanggal</p>
            </div>
            <div className="rounded-base border-2 border-border bg-secondary-background p-3">
              <p className="font-heading text-sm">Y-Axis</p>
              <p className="text-sm">`sale.totalPrice` (revenue) atau `sale.quantity` (cups sold)</p>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-2">
            <div className="rounded-base border-2 border-border bg-secondary-background p-3">
              <p className="font-heading text-sm">Grouping</p>
              <p className="text-sm">Group by minggu dari `sale.soldAt`</p>
            </div>
            <div className="rounded-base border-2 border-border bg-secondary-background p-3">
              <p className="font-heading text-sm">Metric</p>
              <p className="text-sm">SUM `sale.totalPrice`, SUM `sale.quantity`, COUNT `sale.id`</p>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-2">
            <div className="rounded-base border-2 border-border bg-secondary-background p-3">
              <p className="font-heading text-sm">Grouping</p>
              <p className="text-sm">Group by bulan dari `sale.soldAt`</p>
            </div>
            <div className="rounded-base border-2 border-border bg-secondary-background p-3">
              <p className="font-heading text-sm">Breakdown</p>
              <p className="text-sm">
                Segment by `sale.productId` -&gt; `product.name`, optional `sale.customerId`
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
